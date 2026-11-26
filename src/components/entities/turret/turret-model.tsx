import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { Group, Mesh, Vector3 } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { spacebitsMaterial, spacebitsMaterialPool } from "@components/entities/spacebits-material"
import { ndelta } from "@lib/helpers/utils"
import { useGravity } from "@src/hooks/use-gravity"
import turretModel from "@assets/models/turret.glb"
import { useMaterialSwap } from "@src/hooks/use-material-swap"

type TurretNodes = Record<"turret2_1" | "turret2_2", Mesh>

export type TurretRef = {
    // barrel kick and muzzle smoke
    shoot: () => void
    flash: () => void
    position: Vector3 | undefined
}

type TurretModelProps = {
    ref?: Ref<TurretRef>
    falling?: boolean
} & Omit<ThreeElements["group"], "ref">

export default function TurretModel({ ref, falling, ...rest }: TurretModelProps) {
    const { nodes } = useGLTF(turretModel) as unknown as { nodes: TurretNodes }
    const groupRef = useGravity<Group>(!!falling)
    const barrelRef = useRef<Mesh>(null)

    const hit = useMaterialSwap(groupRef, spacebitsMaterialPool)

    useImperativeHandle(ref, () => ({
        shoot: () => {
            if (barrelRef.current) {
                barrelRef.current.position.x = -.65
            }
        },
        flash() {
            hit()
        },
        get position() {
            return groupRef.current?.position
        },
    }), [hit])

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
                material={spacebitsMaterial}
                castShadow
                receiveShadow
            />
            <mesh
                ref={barrelRef}
                geometry={nodes.turret2_2.geometry}
                material={spacebitsMaterial}
                castShadow
                receiveShadow
            />
        </group>
    )
}

useGLTF.preload(turretModel)
