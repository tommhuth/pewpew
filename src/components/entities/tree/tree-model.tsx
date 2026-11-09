import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { Group, Mesh } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { spacebits } from "@components/world/spacebits-material"
import { ndelta } from "@lib/helpers/utils"
import treesModel from "@assets/models/trees.glb"
import random from "@huth/random"
import { Tuple3 } from "@src/types/global"

export enum TreeType {
    TYPE3_01 = "Tree_Type3_01_Model",
    TYPE3_02 = "Tree_Type3_02_Model",
    TYPE3_03 = "Tree_Type3_03_Model",
    TYPE3_04 = "Tree_Type3_04_Model",
    TYPE3_05 = "Tree_Type3_05_Model",
    TYPE4_01 = "Tree_Type4_01_Model",
    TYPE4_02 = "Tree_Type4_02_Model",
    TYPE4_03 = "Tree_Type4_03_Model",
    TYPE4_04 = "Tree_Type4_04_Model",
    TYPE4_05 = "Tree_Type4_05_Model",
    TYPE5_01 = "Tree_Type5_01_Model",
    TYPE5_02 = "Tree_Type5_02_Model",
    TYPE5_03 = "Tree_Type5_03_Model",
    TYPE5_04 = "Tree_Type5_04_Model",
    TYPE7_01 = "Tree_Type7_01_Model",
    TYPE7_02 = "Tree_Type7_02_Model",
    TYPE7_03 = "Tree_Type7_03_Model",
    TYPE7_04 = "Tree_Type7_04_Model",
}

export const treeVariants = Object.entries(TreeType)

export type TreeModelRef = {
    hit: (normal: Tuple3, amount?: number) => void
}

type TreeModelProps = {
    ref?: Ref<TreeModelRef>
    variant: TreeType
} & Omit<ThreeElements["mesh"], "ref">

export default function TreeModel({ ref, variant, position, ...rest }: TreeModelProps) {
    const { nodes } = useGLTF(treesModel) as unknown as { nodes: Record<TreeType, Mesh> }
    const tiltRef = useRef<Group>(null)

    useImperativeHandle(ref, () => ({
        hit: ([nx, , nz], amount = .15) => {
            if (tiltRef.current) {
                let a = random.float(amount * .5, amount)

                tiltRef.current.rotation.x = -nz * a
                tiltRef.current.rotation.z = nx * a
            }
        },
    }), [])

    useFrame((_, delta) => {
        let mesh = tiltRef.current

        if (!mesh) {
            return
        }

        mesh.rotation.x = damp(mesh.rotation.x, 0, 2.5, ndelta(delta))
        mesh.rotation.z = damp(mesh.rotation.z, 0, 2.5, ndelta(delta))
    })

    return (
        <group
            position={position}
            ref={tiltRef}
        >
            <mesh
                geometry={nodes[variant].geometry}
                material={spacebits}
                castShadow
                receiveShadow
                {...rest}
            />
        </group>
    )
}

useGLTF.preload(treesModel)
