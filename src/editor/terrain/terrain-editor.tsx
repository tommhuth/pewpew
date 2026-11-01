import { useGLTF } from "@react-three/drei"
import { Mesh, Vector3Like } from "three"
import { ThreeElements, ThreeEvent } from "@react-three/fiber"
import terrainModel from "@assets/models/terrain.glb"
import { getCellPosition, TerrainType, Terrain } from "@lib/world/terrain"
import TerrainMaterial from "@components/world/terrain/terrain-material"

type TerrainCellProps = { type: TerrainType } & ThreeElements["mesh"]

function TerrainCell({ type, ...rest }: TerrainCellProps) {
    const { nodes } = useGLTF(terrainModel) as unknown as { nodes: Record<TerrainType, Mesh> }

    return (
        <mesh
            geometry={nodes[type].geometry}
            castShadow
            receiveShadow
            {...rest}
        >
            <TerrainMaterial />
        </mesh>
    )
}

interface TerrainEditorProps {
    terrain: Terrain
    // world position of the terrain start, cells run along +z from here
    position?: Vector3Like
    onCellClick?: (x: number, z: number, e: ThreeEvent<MouseEvent>) => void
}

// renders a terrain definition, cell origin at x center, z from 0
export default function TerrainEditor({
    terrain,
    position = { x: 0, y: 0, z: 0 },
    onCellClick
}: TerrainEditorProps) {
    return terrain.map((row, z) => row.map((cell, x) => {
        return (
            <TerrainCell
                key={`${x}-${z}`}
                type={cell.type}
                onClick={onCellClick ? (e) => onCellClick(x, z, e) : undefined}
                position={getCellPosition(x, z, position)}
                rotation={[0, cell.rotation * Math.PI / 2, 0]}
            />
        )
    }))
}

useGLTF.preload(terrainModel)
