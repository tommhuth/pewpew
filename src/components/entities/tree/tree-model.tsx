import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { Group, Mesh } from "three"
import { spacebits, spacebitsPool } from "@components/entities/spacebits-material"
import treesModel from "@assets/models/trees.glb"
import { Tuple3 } from "@src/types/global"
import { useMaterialSwap } from "@src/hooks/use-material-swap"
import { useBend } from "@src/hooks/use-bend"

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
    // tilts away from the normal, any bullet
    hit: (normal: Tuple3, amount?: number) => void
    // hit flash, on damage only
    flash: () => void
}

type TreeModelProps = {
    ref?: Ref<TreeModelRef>
    variant: TreeType
} & Omit<ThreeElements["mesh"], "ref">

export default function TreeModel({ ref, variant, position, ...rest }: TreeModelProps) {
    const { nodes } = useGLTF(treesModel) as unknown as { nodes: Record<TreeType, Mesh> }
    const tiltRef = useRef<Group>(null)

    const flash = useMaterialSwap(tiltRef, spacebitsPool)
    const bend = useBend(tiltRef)

    useImperativeHandle(ref, () => ({
        hit: bend,
        flash,
    }), [bend, flash])

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
