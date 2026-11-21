import { RefObject, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import { Object3D } from "three"
import { damp } from "three/src/math/MathUtils.js"
import random from "@huth/random"
import { ndelta } from "@lib/helpers/utils"
import { Tuple3 } from "@src/types/global"

export function useBend(ref: RefObject<Object3D | null>, recovery = 4.5) {
    useFrame((_, delta) => {
        let object = ref.current

        if (!object) {
            return
        }

        object.rotation.x = damp(object.rotation.x, 0, recovery, ndelta(delta))
        object.rotation.z = damp(object.rotation.z, 0, recovery, ndelta(delta))
    })

    return useCallback(([nx, , nz]: Tuple3, amount = .2) => {
        if (!ref.current) {
            return
        }

        let a = random.float(amount * .5, amount)

        // away from the hit normal 
        ref.current.rotation.x = -nz * a
        ref.current.rotation.z = nx * a
    }, [ref])
}
