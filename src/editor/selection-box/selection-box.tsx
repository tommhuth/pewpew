import { EntityType } from "@src/types/entity"
import { BoundingBoxKey, getBoundingBox } from "@lib/world/bounding-boxes"
import { EditorPlacement } from "../editor-types"

function boundingBoxKey(placement: EditorPlacement): BoundingBoxKey {
    switch (placement.type) {
        case EntityType.TURRET:
            return EntityType.TURRET
        case EntityType.TREE:
            return placement.variant
        default:
            return placement.type
    }
}

// mesh bounds, rotates with the model around the placement origin
export function SelectionBox({ placement, visible }: { placement: EditorPlacement, visible: boolean }) {
    const box = getBoundingBox(boundingBoxKey(placement))

    if (!box || !visible) {
        return null
    }

    return (
        <group
            rotation-y={placement.rotation}
        >
            <mesh position={box.center}>
                <boxGeometry args={box.size} />
                <meshBasicMaterial wireframe color={"#ff0"} toneMapped={false} />
            </mesh>
        </group>
    )
}
