import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { DoubleSide, Mesh } from "three"
import plantModel from "@assets/models/plant.glb"

type PlantModelProps = ThreeElements["mesh"]

export default function PlantModel(props: PlantModelProps) {
    const { nodes } = useGLTF(plantModel) as unknown as { nodes: Record<"plant", Mesh> }

    return (
        <mesh
            geometry={nodes.plant.geometry}
            castShadow
            receiveShadow
            {...props}
        >
            <spacebitsMaterial side={DoubleSide} />
        </mesh>
    )
}

useGLTF.preload(plantModel)
