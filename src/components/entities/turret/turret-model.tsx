import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { Group, Mesh, Vector3 } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { spacebits } from "@components/world/spacebits-material"
import { ndelta } from "@lib/helpers/utils"
import { Tuple3 } from "@src/types/global"
import { useGravity } from "@src/hooks/use-gravity"
import turretModel from "@assets/models/turret.glb"
import { useSpacebitsMaterialSwap } from "@src/hooks/use-spacebits-material-swap"
import { hitSpacebitsMaterial } from "@components/world/spacebits-material-pool"

type TurretNodes = Record<"turret2_1" | "turret2_2", Mesh>

export type TurretRef = {
    // barrel kick and muzzle smoke
    shoot: () => void
    hit: () => void
    position: Vector3 | undefined
}

const muzzlePosition: Tuple3 = [1.5, .5, 0]

type TurretModelProps = {
    ref?: Ref<TurretRef>
    falling?: boolean
} & Omit<ThreeElements["group"], "ref">

export default function TurretModel({ ref, falling, ...rest }: TurretModelProps) {
    const { nodes } = useGLTF(turretModel) as unknown as { nodes: TurretNodes }
    const groupRef = useGravity<Group>(!!falling)
    const barrelRef = useRef<Mesh>(null)

    useSpacebitsMaterialSwap(groupRef)

    useImperativeHandle(ref, () => ({
        shoot: () => {
            if (barrelRef.current) {
                barrelRef.current.position.x = -.65
            }
        },
        hit() {
            hitSpacebitsMaterial(groupRef.current)
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
        </group>
    )
}

useGLTF.preload(turretModel)
