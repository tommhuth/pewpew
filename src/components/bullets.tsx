import { useFrame } from "@react-three/fiber"
import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { Color, ColorRepresentation, CylinderGeometry, InstancedMesh, Vector3 } from "three"
import random from "@huth/random"
import { useStore } from "@lib/store"
import { dispatchCollisionEvent, getBulletCollision } from "@lib/helpers/collisions"
import { BULLET_COUNT, BULLET_SIZE } from "@lib/const"
import { ndelta, setColorAt, setMatrixAt, setMatrixNullAt } from "@lib/helpers/utils"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import LineSegment from "@lib/helpers/line-segment"
import LoopCounter from "@lib/helpers/loop-counter"
import { lightIndex, updateLight } from "@components/effects/lights/lights"
import { Bullet, Owner } from "@src/types/bullet"
import { Tuple3 } from "@src/types/global"
import { WorldPart } from "@src/types/world"
import { cellsize, getTerrainHeightAt } from "@lib/world/terrain"
import { createParticles } from "@components/effects/particle/particle-mesh"

// pool of all bullets, reused for the lifetime of the app to avoid per-shot allocs
const pool: Bullet[] = Array.from({ length: BULLET_COUNT }, (_, i) => ({
    id: "",
    line: new LineSegment(new Vector3(), new Vector3(1, 0, 0), BULLET_SIZE),
    index: i,
    lightIndex: 0,
    mounted: false,
    color: "#fff",
    speed: 0,
    owner: Owner.PLAYER,
    rotation: 0,
}))

// active bullets, references into pool. nothing renders off the list
export const bullets: Bullet[] = []

const bulletIndex = new LoopCounter(BULLET_COUNT)

interface CreateBulletParams {
    position: Tuple3
    rotation?: number
    owner: Owner
    speed: number
    color?: ColorRepresentation
}

export function createBullet({
    position,
    rotation = 0,
    owner,
    speed,
    color = "#fff",
}: CreateBulletParams) {
    const idx = bulletIndex.next()
    const bullet = pool[idx]

    // if this pool slot is still in the active list (wrap-around before it died), evict it
    const existing = bullets.indexOf(bullet)

    if (existing > -1) {
        bullets.splice(existing, 1)
    }

    bullet.id = random.id()
    bullet.line.position.set(position[0], position[1], position[2])
    // rotation 0 points along +x
    bullet.line.direction.set(Math.cos(rotation), 0, -Math.sin(rotation))
    bullet.index = idx
    bullet.lightIndex = lightIndex.next()
    bullet.mounted = false
    bullet.color = color
    bullet.speed = speed
    bullet.owner = owner
    bullet.rotation = rotation

    bullets.push(bullet)
}

export function removeBullet(id: string) {
    for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].id === id) {
            bullets.splice(i, 1)

            return
        }
    }
}

// the part the bullet is inside the terrain of, if any
function getTerrainHit(bullet: Bullet, parts: WorldPart[]) {
    const { position } = bullet.line

    for (let i = 0, n = parts.length; i < n; i++) {
        const part = parts[i]

        if (position.z >= part.position.z && position.z < part.position.z + part.size[1]) {
            return position.y < part.position.y + getTerrainHeightAt(part.terrain, position, part.position.z) ? part : null
        }
    }

    return null
}

// set up front so the first setColorAt doesnt add instanceColor and recompile the shader
const colors = new Float32Array(BULLET_COUNT * 3).fill(1)
const cylinder = new CylinderGeometry(.5, .5, 1, 10, 1)

// along x, same as bullet rotation 0
cylinder.rotateZ(Math.PI * .5)

// reused each frame per bullet, avoids param object + tuple literal allocations
const _bulletRot: Tuple3 = [0, 0, 0]
const _bulletScale: Tuple3 = [BULLET_SIZE, .1, .1]
const _bulletMatrix = {
    instance: null as unknown as InstancedMesh,
    index: 0,
    position: null as unknown as Vector3,
    rotation: _bulletRot,
    scale: _bulletScale,
}
const _lightInnerColor = new Color("#fff")
const _lightOuterColor = new Color("#fffcde")

export default function Bullets() {
    const [instance, setInstance] = useTransitionedState<InstancedMesh | null>(null)

    useInstanceClear(instance, BULLET_COUNT)

    useFrame((_, delta) => {
        const { player, world } = useStore.getState()

        if (!instance || !player.object) {
            return
        }

        // backwards so removing while looping is safe
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i]
            const hit = getBulletCollision(bullet)
            const part = hit ? null : getTerrainHit(bullet, world.parts)
            let dead = false

            if (hit) {
                let [client, normal, point] = hit

                dead = dispatchCollisionEvent({
                    client,
                    bullet,
                    normal: normal.toArray(),
                    point: point.toArray()
                })
            } else if (part) {
                const { position } = bullet.line

                createParticles({
                    position: position.toArray(),
                    offset: [[-.1, .1], [-.1, .1], [-.1, .1]],
                    normal: [
                        -bullet.line.direction.x,
                        0,
                        -bullet.line.direction.z
                    ],
                    speed: [2.5, 6],
                    count: [2, 4],
                    radius: [.05, .15],
                    stagger: [0, 0],
                    color: "#f4f6fa",
                })
                dead = true
            }

            if (!bullet.mounted) {
                setColorAt(instance, bullet.index, bullet.color)
                bullet.mounted = true
            }

            bullet.line.position.x += bullet.line.direction.x * bullet.speed * ndelta(delta)
            bullet.line.position.z += bullet.line.direction.z * bullet.speed * ndelta(delta)

            _bulletRot[1] = bullet.rotation
            _bulletMatrix.instance = instance
            _bulletMatrix.index = bullet.index
            _bulletMatrix.position = bullet.line.position
            setMatrixAt(_bulletMatrix)

            // radius, decay, intensity. stops once the bullet is gone and the light fades out
            updateLight(bullet.lightIndex, 2, 3, 1, bullet.line.position, _lightInnerColor, _lightOuterColor)

            let outside = Math.abs(bullet.line.position.z - player.object.position.z) > 20
                || bullet.line.position.x < -10
                || bullet.line.position.x > 10
                || bullet.line.position.z < player.object.position.z - 10

            if (dead || outside) {
                bullets.splice(i, 1)
                setMatrixNullAt(instance, bullet.index)
            }
        }
    })

    return (
        <instancedMesh
            ref={setInstance}
            args={[cylinder, undefined, BULLET_COUNT]}
            castShadow
            frustumCulled={false}
        >
            <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
            <meshLambertMaterial color={"red"} />
        </instancedMesh>
    )
}
