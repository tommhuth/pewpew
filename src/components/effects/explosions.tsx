import { useFrame } from "@react-three/fiber"
import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { InstancedMesh } from "three"
import random from "@huth/random"
import { useStore } from "@lib/store"
import { ndelta } from "@lib/helpers/utils"
import { FIREBALL_COUNT, SHOCKWAVE_COUNT } from "@lib/const"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Explosion } from "@src/types/explosion"
import { Tuple2, Tuple3 } from "@src/types/global"
import FireballMesh, { createFireballs, updateFireball } from "./fireball/fireball-mesh"
import ShockwaveMesh, { createShockwave, updateShockwave } from "./shockwave/shockwave-mesh"
import ParticleMesh from "./particle-mesh"
import DecalMesh from "./decal/decal-mesh"


// active explosions, nothing renders off the list
export const explosions: Explosion[] = []

interface CreateExplosionParams {
    position: Tuple3
    count?: number
    radius: Tuple2 // fireball start radius, spread from first to last fireball
    growth?: Tuple2 // fireball max radius as a multiple of its start radius
    spread: [xz: number, y: number] // fireball offset from position, xz either side, y upwards
    shockwave?: boolean
    delay?: number
}

export function createExplosion({
    position,
    count = 12,
    radius,
    growth = [1, 3.5],
    spread,
    delay = 0,
}: CreateExplosionParams) {
    return setTimeout(() => {
        const baseLifetime = random.integer(1400, 2000)

        explosions.push({
            id: random.id(),
            position,
            lifetime: random.integer(baseLifetime * .75, baseLifetime),
            time: 0,
            mounted: false,
            shockwave: random.boolean(.65) ? createShockwave(radius[1] * 5) : null,
            fireballs: createFireballs({
                position,
                count,
                radius,
                growth,
                spread,
                lifetime: [baseLifetime * .375, baseLifetime],
            }),
        })
    }, delay)
}

export default function Explosions() {
    const [fireballInstance, setFireballInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [shockwaveInstance, setShockwaveInstance] = useTransitionedState<InstancedMesh | null>(null)

    useInstanceClear(fireballInstance, FIREBALL_COUNT)
    useInstanceClear(shockwaveInstance, SHOCKWAVE_COUNT)

    useFrame((state, delta) => {
        const { player } = useStore.getState()

        if (!fireballInstance || !shockwaveInstance || !player.object) {
            return
        }

        const diagonal = Math.hypot(state.viewport.width, state.viewport.height)

        const nd = ndelta(delta)
        const t = nd * 1000

        // backwards so removing while looping is safe
        for (let i = explosions.length - 1; i >= 0; i--) {
            const explosion = explosions[i]
            const outside = explosion.position[2] < player.object.position.z - diagonal

            if (outside || explosion.time > explosion.lifetime) {
                explosions.splice(i, 1)
                continue
            }

            if (!explosion.mounted) {
                explosion.mounted = true
            }

            for (const fireball of explosion.fireballs) {
                updateFireball(fireballInstance, fireball)
                fireball.time += t
            }

            if (explosion.shockwave) {
                updateShockwave(shockwaveInstance, explosion.shockwave, explosion.position)
                explosion.shockwave.time += t
            }

            explosion.time += t
        }
    })

    return (
        <>
            <FireballMesh ref={setFireballInstance} />
            <ShockwaveMesh ref={setShockwaveInstance} />
            <ParticleMesh />
            <DecalMesh />
        </>
    )
}
