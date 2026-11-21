import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { Mesh } from "three"
import plantModel from "@assets/models/plant.glb"
import { plant } from "./plant-material"

type PlantModelProps = ThreeElements["mesh"]

export default function PlantModel(props: PlantModelProps) {
    const { nodes } = useGLTF(plantModel) as unknown as { nodes: Record<"plant", Mesh> }

    return (
        <mesh
            geometry={nodes.plant.geometry}
            material={plant}
            castShadow
            receiveShadow
            dispose={null}
            {...props}
        />
    )
}

useGLTF.preload(plantModel)
