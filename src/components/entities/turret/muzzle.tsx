import { Ref, useImperativeHandle, useMemo, useRef } from "react"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { InstancedMesh, MeshLambertMaterial, SphereGeometry } from "three"
import { damp } from "three/src/math/MathUtils.js"
import random from "@huth/random"
import { ndelta, setMatrixAt } from "@lib/helpers/utils"
import { Tuple3 } from "@src/types/global"

export type MuzzleRef = { activate: () => void }

interface Smoke {
    index: number
    scale: number
    position: Tuple3
}

type MuzzleProps = {
    ref?: Ref<MuzzleRef>
    // added to each puff's damp speed
    decay?: number
} & Omit<ThreeElements["instancedMesh"], "ref" | "args">

const geometry = new SphereGeometry(1, 6, 6)
const material = new MeshLambertMaterial({
    color: "#d9f3ff",
    emissive: "#fff",
    emissiveIntensity: .35,
})
const count = 8

// smoke puffs drifting out along +x
export default function Muzzle({ ref, decay = 0, ...rest }: MuzzleProps) {
    const instanceRef = useRef<InstancedMesh>(null)
    const smokes = useMemo<Smoke[]>(() => {
        return Array.from({ length: count }, (_, index) => ({ index, scale: 0, position: [0, 0, 0] }))
    }, [])

    useImperativeHandle(ref, () => ({
        activate: () => {
            for (const smoke of smokes) {
                const size = random.float(.25, .65)
                // bigger puffs stay closer to the middle
                const offset = 1 - (size - .25) / .5

                smoke.scale = size
                smoke.position[0] = random.float(-.5, .5) * offset
                smoke.position[1] = random.float(-.5, .5) * offset
                smoke.position[2] = random.float(-.25, .25) * offset
            }
        }
    }), [smokes])

    useFrame((_, delta) => {
        if (!instanceRef.current) {
            return
        }

        const nd = ndelta(delta)

        for (const smoke of smokes) {
            setMatrixAt({
                index: smoke.index,
                scale: smoke.scale,
                instance: instanceRef.current,
                position: smoke.position,
            })

            // later puffs shrink faster
            smoke.scale = damp(smoke.scale, 0, smoke.index + 2 + decay, nd)
            smoke.position[0] += smoke.scale * 10 * nd

            if (smoke.scale < .01) {
                smoke.scale = 0
            }
        }
    })

    return (
        <instancedMesh
            castShadow
            receiveShadow
            args={[geometry, material, count]}
            ref={instanceRef}
            {...rest}
        />
    )
}
