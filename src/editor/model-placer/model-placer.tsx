import { Html } from "@react-three/drei"
import { useEffect } from "react"
import Model, { ModelType } from "@components/model"
import TurretModel from "@components/entities/turret/turret-model"
import TreeModel, { TreeType, treeVariants } from "@components/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import {
    createPlacement,
    removePlacement,
    setActivePlacement,
    setPlacementKind,
    updatePlacement,
    useEditorStore,
} from "../store"
import { EditorMode, EditorPlacement } from "../editor-types"
import { defaultPlantKind, defaultTreeKind, defaultTurretKind } from "../editor-const"
import { ModelSelect } from "../model-select/model-select"
import { VectorInput } from "../vector-input/vector-input"
import { SelectionBox } from "../selection-box/selection-box"
import PlantModel from "@components/entities/plant/plant-model"
import { RangeInput } from "../range-input/range-input"

const noPlacements: EditorPlacement[] = []

// Html mounts into events.connected, which is the canvas, so point it at #ui instead
const uiPortal = { current: document.getElementById("ui") as HTMLElement }

function renderEntity(placement: EditorPlacement) {
    switch (placement.type) {
        case EntityType.TURRET:
            return <TurretModel rotation-y={placement.rotation} />
        case EntityType.TREE:
            return <TreeModel variant={placement.variant} rotation-y={placement.rotation} />
        case EntityType.PLANT:
            return <PlantModel rotation-y={placement.rotation} scale={placement.scale} />
        default:
            return <Model type={placement.type} rotation-y={placement.rotation} />
    }
}

function makePlacementData(type: ModelType | EntityType) {
    switch (type) {
        case EntityType.TURRET:
            return defaultTurretKind
        case EntityType.TREE:
            return defaultTreeKind
        case EntityType.PLANT:
            return defaultPlantKind
        default:
            return { type: type as ModelType }
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

                    {activePlacementId === placement.id && (
                        <Html
                            center
                            portal={uiPortal}
                            className="translate-y-3/4 flex flex-col gap-4 p-3 rounded bg-black/50 backdrop-blur-xs font-mono text-xs text-white whitespace-nowrap"
                        >
                            <ModelSelect
                                value={placement.type}
                                onChange={(type) => {
                                    if (!type) return

                                    setPlacementKind(placement.id, makePlacementData(type))
                                }}
                            />

                            {placement.type === EntityType.TREE && (
                                <select
                                    className="bg-transparent uppercase"
                                    aria-label="Variant"
                                    value={placement.variant}
                                    onChange={(e) => {
                                        updatePlacement(placement.id, {
                                            variant: e.currentTarget.value as TreeType,
                                        })
                                    }}
                                >
                                    {treeVariants.map(([name, value]) => (
                                        <option key={value} value={value}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {placement.type === EntityType.PLANT && (
                                <RangeInput
                                    label="Scale"
                                    value={placement.scale}
                                    formattedValue={placement.scale.toFixed(1)}
                                    min={.5}
                                    max={1.25}
                                    step={.1}
                                    onChange={(e) => {
                                        updatePlacement(placement.id, {
                                            scale: e.currentTarget.valueAsNumber
                                        })
                                    }}
                                />
                            )}

                            <RangeInput
                                label="Rotation"
                                formattedValue={`${Math.round(placement.rotation * (180 / Math.PI))}deg`}
                                min={0}
                                max={placement.type === EntityType.TURRET ? 270 : 350}
                                step={placement.type === EntityType.TURRET ? 90 : 10}
                                value={placement.rotation * (180 / Math.PI)}
                                onChange={(e) => {
                                    updatePlacement(placement.id, {
                                        rotation: e.currentTarget.valueAsNumber * (Math.PI / 180)
                                    })
                                }}
                            />

                            <VectorInput
                                legend="Position"
                                value={placement.position}
                                onChange={(position) => updatePlacement(placement.id, { position })}
                            />
                        </Html>
                    )}
                </group>
            ))}
        </>
    )
}