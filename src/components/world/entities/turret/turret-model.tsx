import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { Group, Mesh, Vector3 } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { spacebits } from "@lib/materials"
import { ndelta } from "@lib/helpers/utils"
import { Tuple3 } from "@src/types/global"
import { useGravity } from "@src/hooks/use-gravity"
import Muzzle, { MuzzleRef } from "./muzzle"
import turretModel from "@assets/models/turret2.glb"

// one mesh of 2 primitives in the glb, 1 is the body and 2 the barrel
type TurretNodes = Record<"turret2_1" | "turret2_2", Mesh>

export type TurretRef = {
    // barrel kick and muzzle smoke
    shoot: () => void
    // live, moves while falling
    position: Vector3 | undefined
}

// sits on y 0, square so rotation doesnt matter, barrel sticks out along +x past it
export const turretSize: Tuple3 = [1.2, .85, 1.2]

// in the barrel, a bit back from the tip
const muzzlePosition: Tuple3 = [1.78, .5, 0]

type TurretModelProps = {
    ref?: Ref<TurretRef>
    falling?: boolean
} & Omit<ThreeElements["group"], "ref">

export default function TurretModel({ ref, falling, ...rest }: TurretModelProps) {
    const { nodes } = useGLTF(turretModel) as unknown as { nodes: TurretNodes }
    const groupRef = useGravity<Group>(!!falling)
    const barrelRef = useRef<Mesh>(null)
    const muzzleRef = useRef<MuzzleRef>(null)

    useImperativeHandle(ref, () => ({
        shoot: () => {
            if (barrelRef.current) {
                barrelRef.current.position.x = -.65
            }

            muzzleRef.current?.activate()
        },
        get position() {
            return groupRef.current?.position
        },
    }), [])

    useFrame((_, delta) => {
        if (!barrelRef.current) {
            return
        }

        barrelRef.current.position.x = damp(barrelRef.current.position.x, 0, 2, ndelta(delta))
    })

    return (
        <group
            ref={groupRef}
            {...rest}
        >
            <mesh
                geometry={nodes.turret2_1.geometry}
                material={spacebits}
                castShadow
                receiveShadow
            />
            <mesh
                ref={barrelRef}
                geometry={nodes.turret2_2.geometry}
                material={spacebits}
                castShadow
                receiveShadow
            />
            <Muzzle
                ref={muzzleRef}
                position={muzzlePosition}
                scale={.9}
            />
        </group>
    )
}

useGLTF.preload(turretModel)
