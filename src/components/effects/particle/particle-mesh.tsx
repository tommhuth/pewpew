import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { ColorRepresentation, InstancedMesh, SphereGeometry, Vector3 } from "three"
import random from "@huth/random"
import { PARTICLE_COUNT } from "@lib/const"
import { useStore } from "@lib/store"
import { addScaled, dampFactor, ndelta, scaleXZ, setColorAt, setMatrixAt } from "@lib/helpers/utils"
import { getTerrainHeightAt, OUTSIDE_TERRAIN_HEIGHT } from "@lib/world/terrain"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Particle } from "@src/types/explosion"
import { Tuple2, Tuple3 } from "@src/types/global"
import { WorldPart } from "@src/types/world"
import { useFrame } from "@react-three/fiber"
import { useLights } from "@components/effects/lights/lights"
import type { ParticleMaterial } from "./particle-material"

export const particles: Particle[] = []

const particleIndex = new LoopCounter(PARTICLE_COUNT)

export interface CreateParticlesParams {
    position: Tuple3 // base position
    offset?: [x: Tuple2, y: Tuple2, z: Tuple2] // additional position offset
    normal?: Tuple3 // main particle direction
    speed?: Tuple2 // base speed
    spread?: [xz: Tuple2, y: Tuple2] // normal offset
    count?: Tuple2 | number
    restitution?: Tuple2
    stagger?: Tuple2 // individual delay in ms
    friction?: Tuple2 | number
    radius?: Tuple2 | number
    color: ColorRepresentation | ColorRepresentation[]
    delay?: number // base delay
    gravity?: Tuple3
}

const _direction = new Vector3()

export function createParticles({
    position,
    offset = [[-1, 1], [-1, 1], [-1, 1]],
    normal = [0, 1, 0],
    spread = [[-.85, .85], [0, .5]],
    speed = [5, 10],
    count = [2, 3],
    friction = [1.25, 1.5], // 0 - 5
    restitution = [.2, .5],
    color,
    radius = [.15, .25],
    stagger = [-150, 0],
    delay = 0,
    gravity = [0, -random.integer(20, 25), 0],
}: CreateParticlesParams) {
    return setTimeout(() => {
        const amount = Array.isArray(count) ? random.integer(...count) : count

        for (let i = 0; i < amount; i++) {
            _direction.set(
                normal[0] + random.float(...spread[0]),
                normal[1] + random.float(...spread[1]),
                normal[2] + random.float(...spread[0]),
            ).normalize()

            particles.push({
                index: particleIndex.next(),
                position: [
                    position[0] + random.float(...offset[0]),
                    position[1] + random.float(...offset[1]),
                    position[2] + random.float(...offset[2]),
                ],
                velocity: [
                    _direction.x * random.float(...speed),
                    _direction.y * random.float(...speed),
                    _direction.z * random.float(...speed),
                ],
                acceleration: gravity,
                rotation: [
                    random.float(0, Math.PI * 2),
                    random.float(0, Math.PI * 2),
                    random.float(0, Math.PI * 2),
                ],
                friction: typeof friction === "number" ? friction : random.float(...friction),
                restitution: random.float(...restitution),
                radius: typeof radius === "number" ? radius : radius[0] + (radius[1] - radius[0]) * (amount > 1 ? i / (amount - 1) : 0),
                color: Array.isArray(color) ? random.pick(...color) : color,
                time: random.integer(...stagger),
                mounted: false,
            })
        }
    }, delay)
}

const geometry = new SphereGeometry(1, 3, 4)
const colors = new Float32Array(PARTICLE_COUNT * 3).fill(1)
const _terrainPosition = new Vector3()

function getTerrainHeight(position: Tuple3, parts: WorldPart[]) {
    _terrainPosition.set(position[0], position[1], position[2])

    for (let i = 0, n = parts.length; i < n; i++) {
        const part = parts[i]

        if (position[2] >= part.position.z && position[2] < part.position.z + part.size[1]) {
            return part.position.y + getTerrainHeightAt(part.terrain, _terrainPosition, part.position.z)
        }
    }

    return OUTSIDE_TERRAIN_HEIGHT
}

export default function ParticleMesh() {
    const [particleInstance, setParticleInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [material, setMaterial] = useTransitionedState<ParticleMaterial | null>(null)

    useInstanceClear(particleInstance, PARTICLE_COUNT)
    useLights(material?.uLights)

    useFrame((state, delta) => {
        const { world, player } = useStore.getState()

        if (!particleInstance || !player.object) {
            return
        }

        const nd = ndelta(delta)
        const diagonal = 10

        // backwards so removing while looping is safe
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i]
            const { position, velocity, acceleration, rotation, radius, time } = particle

            if (position[2] < player.object.position.z - diagonal) {
                particles.splice(i, 1)
                continue
            }
            const floorY = getTerrainHeight(position, world.parts)
            const grounded = position[1] <= floorY + radius + .15
            const magnitude = Math.abs(velocity[0]) + Math.abs(velocity[2])

            if (!particle.mounted) {
                setColorAt(particleInstance, particle.index, particle.color)
                particle.mounted = true
            }

            particle.time += nd * 1000

            if (time < 0) {
                continue
            }

            // at rest or 15s old, the instance is left where it is as debris until the slot is reused
            if ((magnitude < .05 && grounded) || time > 10_000) {
                particles.splice(i, 1)
                continue
            }

            addScaled(velocity, acceleration, nd)
            scaleXZ(velocity, dampFactor(grounded ? 3 : particle.friction, nd))
            addScaled(position, velocity, nd)

            position[1] = Math.max(floorY + radius * .25, position[1])

            rotation[0] += -velocity[0] * nd * 6
            rotation[1] += -velocity[1] * nd * 4
            rotation[2] += -velocity[2] * nd * 5

            if (position[1] <= floorY + radius * .25) {
                velocity[1] *= -particle.restitution
            }

            setColorAt(particleInstance, particle.index, particle.color)
            setMatrixAt({
                instance: particleInstance,
                index: particle.index,
                position,
                rotation,
                scale: radius,
            })
        }
    })

    return (
        <instancedMesh
            ref={setParticleInstance}
            args={[geometry, undefined, PARTICLE_COUNT]}
            castShadow
            receiveShadow
            frustumCulled={false}
        >
            <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
            <particleMaterial ref={setMaterial} />
        </instancedMesh>
    )
}
