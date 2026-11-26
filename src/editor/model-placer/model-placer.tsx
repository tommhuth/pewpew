import { useEffect } from "react"
import Model from "@components/model"
import TurretModel from "@components/entities/turret/turret-model"
import TreeModel from "@components/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import {
    createPlacement,
    removePlacement,
    setActivePlacement,
    useEditorStore,
} from "../store"
import { EditorMode, EditorPlacement } from "../editor-types"
import { SelectionBox } from "../selection-box/selection-box"
import PlantModel from "@components/entities/plant/plant-model"
import RocketModel from "@components/entities/rocket/rocket-model"

const noPlacements: EditorPlacement[] = []

function renderEntity(placement: EditorPlacement) {
    switch (placement.type) {
        case EntityType.TURRET:
            return <TurretModel rotation-y={placement.rotation} />
        case EntityType.TREE:
            return <TreeModel variant={placement.variant} rotation-y={placement.rotation} />
        case EntityType.PLANT:
            return <PlantModel rotation-y={placement.rotation} scale={placement.scale} />
        case EntityType.ROCKET:
            return <RocketModel rotation-y={placement.rotation} />
        default:
            return <Model type={placement.type} rotation-y={placement.rotation} />
    }
}

export default function ModelPlacer() {
    const placements = useEditorStore(i => (i.map && i.maps[i.map]?.placements) || noPlacements)
    const activePlacementId = useEditorStore(i => i.activePlacementId)
    const mode = useEditorStore(i => i.mode)
    const placing = mode === EditorMode.PLACEMENT

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const { activePlacementId } = useEditorStore.getState()

            if (activePlacementId && ["Backspace", "Delete"].includes(e.code)) {
                removePlacement(activePlacementId)
            }
        }

        window.addEventListener("keydown", onKeyDown)

        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    return (
        <>
            <mesh
                rotation-x={-Math.PI / 2}
                onClick={(e) => {
                    if (!placing) {
                        return
                    }

                    e.stopPropagation()

                    if (useEditorStore.getState().activePlacementId) {
                        setActivePlacement(null)
                    } else {
                        createPlacement(e.point.toArray())
                    }
                }}
            >
                <planeGeometry args={[1000, 1000]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            {placements.map(placement => (
                <group
                    key={placement.id}
                    position={placement.position}
                    onClick={(e) => {
                        if (!placing) {
                            return
                        }

                        e.stopPropagation()
                        setActivePlacement(activePlacementId === placement.id ? null : placement.id)
                    }}
                >
                    {renderEntity(placement)}

                    <SelectionBox
                        placement={placement}
                        visible={activePlacementId === placement.id}
                    />
                </group>
            ))}
        </>
    )
}