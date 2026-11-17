import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { Mesh } from "three"
import { spacebits } from "@components/world/spacebits-material"
import plantModel from "@assets/models/plant.glb"

type PlantModelProps = ThreeElements["mesh"]

export default function PlantModel(props: PlantModelProps) {
    const { nodes } = useGLTF(plantModel) as unknown as { nodes: Record<"plant", Mesh> }

    return (
        <mesh
            geometry={nodes.plant.geometry}
            material={spacebits}
            castShadow
            receiveShadow
            {...props}
        />
    )
}

useGLTF.preload(plantModel)
