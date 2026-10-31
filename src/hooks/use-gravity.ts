import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Object3D } from "three"
import random from "@huth/random"
import { ndelta } from "@lib/helpers/utils"
import { Tuple2 } from "@src/types/global"

export function useGravity<T extends Object3D = Object3D>(active: boolean, acceleration = 6) {
    const ref = useRef<T>(null)
    const velocity = useRef(0)
    const tilt = useMemo<Tuple2>(() => [random.float(-.3, .3), random.float(-.3, .3)], [])

    useFrame((_, delta) => {
        if (!active || !ref.current) {
            return
        }

        const nd = ndelta(delta)

        velocity.current += acceleration * nd
        ref.current.position.y -= velocity.current * nd
        ref.current.rotation.x += tilt[0] * nd
        ref.current.rotation.z += tilt[1] * nd
        ref.current.rotation.y += tilt[1] * nd * .1
    })

    return ref
}
