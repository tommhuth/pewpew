import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { Group, Mesh } from "three"
import plantModel from "@assets/models/plant.glb"
import { plant, plantPool } from "./plant-material"
import { Tuple3 } from "@src/types/global"
import { useMaterialSwap } from "@src/hooks/use-material-swap"
import { useBend } from "@src/hooks/use-bend"

export type PlantModelRef = {
    // tilts away from the normal, any bullet
    hit: (normal: Tuple3, amount?: number) => void
    // hit flash, on damage only
    flash: () => void
}

type PlantModelProps = {
    ref?: Ref<PlantModelRef>
} & Omit<ThreeElements["mesh"], "ref">

export default function PlantModel({ ref, position, ...rest }: PlantModelProps) {
    const { nodes } = useGLTF(plantModel) as unknown as { nodes: Record<"plant", Mesh> }
    const tiltRef = useRef<Group>(null)

    const flash = useMaterialSwap(tiltRef, plantPool)
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
                geometry={nodes.plant.geometry}
                material={plant}
                castShadow
                receiveShadow
                dispose={null}
                {...rest}
            />
        </group>
    )
}

useGLTF.preload(plantModel)
