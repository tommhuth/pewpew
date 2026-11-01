import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements, useFrame } from "@react-three/fiber"
import { Mesh } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { spacebits } from "@components/world/spacebits-material"
import { ndelta } from "@lib/helpers/utils"
import treesModel from "@assets/models/trees.glb"
import random from "@huth/random"

export enum TreeType {
    TYPE0_01 = "Tree_Type0_01_Model",
    TYPE0_02 = "Tree_Type0_02_Model",
    TYPE0_03 = "Tree_Type0_03_Model",
    TYPE0_04 = "Tree_Type0_04_Model",
    TYPE0_05 = "Tree_Type0_05_Model",
    TYPE0_06 = "Tree_Type0_06_Model",
    TYPE1_01 = "Tree_Type1_01_Model",
    TYPE1_02 = "Tree_Type1_02_Model",
    TYPE1_03 = "Tree_Type1_03_Model",
    TYPE1_04 = "Tree_Type1_04_Model",
    TYPE1_05 = "Tree_Type1_05_Model",
    TYPE2_01 = "Tree_Type2_01_Model",
    TYPE2_02 = "Tree_Type2_02_Model",
    TYPE2_03 = "Tree_Type2_03_Model",
    TYPE2_04 = "Tree_Type2_04_Model",
    TYPE2_05 = "Tree_Type2_05_Model",
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
    TYPE6_01 = "Tree_Type6_01_Model",
    TYPE6_02 = "Tree_Type6_02_Model",
    TYPE6_03 = "Tree_Type6_03_Model",
    TYPE6_04 = "Tree_Type6_04_Model",
    TYPE7_01 = "Tree_Type7_01_Model",
    TYPE7_02 = "Tree_Type7_02_Model",
    TYPE7_03 = "Tree_Type7_03_Model",
    TYPE7_04 = "Tree_Type7_04_Model",
}

// what the editor offers, type 0, 1, 2 and 6 left out
export const treeVariants = Object.entries(TreeType).filter(([name]) => !/^TYPE[0126]_/.test(name))

export type TreeRef = {
    // tilts on z, eases back to 0
    hit: (amount?: number) => void
}

type TreeModelProps = {
    ref?: Ref<TreeRef>
    variant: TreeType
} & Omit<ThreeElements["mesh"], "ref">

export default function TreeModel({ ref, variant, ...rest }: TreeModelProps) {
    const { nodes } = useGLTF(treesModel) as unknown as { nodes: Record<TreeType, Mesh> }
    const meshRef = useRef<Mesh>(null)

    useImperativeHandle(ref, () => ({
        hit: (amount = .15) => {
            if (meshRef.current) {
                meshRef.current.rotation.x = random.float(amount * .5, amount)
            }
        },
    }), [])

    useFrame((_, delta) => {
        if (!meshRef.current) {
            return
        }

        meshRef.current.rotation.x = damp(meshRef.current.rotation.x, 0, 2.5, ndelta(delta))
    })

    return (
        <mesh
            geometry={nodes[variant].geometry}
            material={spacebits}
            castShadow
            receiveShadow
            ref={meshRef}
            {...rest}
        />
    )
}

useGLTF.preload(treesModel)
