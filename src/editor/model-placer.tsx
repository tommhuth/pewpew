import { Html } from "@react-three/drei"
import { Fragment, useEffect, useRef } from "react"
import { Tuple3 } from "@src/types/global"
import Model, { modelGroups, ModelType } from "@components/model"
import TurretModel from "@components/world/entities/turret/turret-model"
import TreeModel, { TreeType, treeVariants } from "@components/world/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import { BoundingBoxKey, getBoundingBox } from "@lib/bounding-boxes"
import {
    addPlacement,
    defaultTreeKind,
    defaultTurretKind,
    EditorMode,
    PLACEMENT_PRECISION,
    EditorPlacement,
    removePlacement,
    roundToNearest,
    setActivePlacement,
    setPlacementKind,
    updatePlacement,
    useEditorStore,
} from "./store"

interface VectorInputProps {
    legend: string
    value: Tuple3
    onUpdate: (value: Tuple3) => void
}

// drag up/down on a value to change it
function VectorInput({ legend, value, onUpdate }: VectorInputProps) {
    const translateRef = useRef<Tuple3 | null>(null)

    return (
        <fieldset className="flex flex-col gap-1">
            <legend className="opacity-50 mb-1">
                {legend}
            </legend>

            <div className="flex items-center">
                [
                {value.map((v, index) => (
                    <Fragment key={index}>
                        <input
                            className="w-[4.5em] text-right cursor-ns-resize bg-transparent"
                            type="number"
                            value={v.toFixed(2)}
                            readOnly
                            aria-label={["x", "y", "z"][index]}
                            onPointerDown={({ currentTarget }) => currentTarget.requestPointerLock()}
                            onPointerUp={() => {
                                document.exitPointerLock()
                                onUpdate(value.map(i => roundToNearest(i, PLACEMENT_PRECISION)) as Tuple3)
                            }}
                            onPointerMove={({ movementY }) => {
                                if (!document.pointerLockElement) {
                                    return
                                }

                                const updated: Tuple3 = [...value]

                                updated[index] -= movementY * .025
                                onUpdate(updated)
                            }}
                        />
                        {index < 2 ? "," : null}
                    </Fragment>
                ))}
                ]
                <button
                    aria-label="Click and move to translate along x-z plane"
                    className="ml-4 cursor-move"
                    onPointerDown={({ currentTarget }) => {
                        translateRef.current = [...value]
                        currentTarget.requestPointerLock()
                    }}
                    onPointerUp={() => {
                        document.exitPointerLock()
                        translateRef.current = null
                    }}
                    onPointerMove={({ movementX, movementY }) => {
                        const raw = translateRef.current

                        if (!document.pointerLockElement || !raw) {
                            return
                        }

                        // accumulate unsnapped so small moves add up, show it snapped
                        raw[0] -= movementX * .025
                        raw[2] -= movementY * .025

                        onUpdate([
                            roundToNearest(raw[0], PLACEMENT_PRECISION),
                            value[1],
                            roundToNearest(raw[2], PLACEMENT_PRECISION),
                        ])
                    }}
                >
                    <span className="block scale-200">&harr;</span>
                </button>
            </div>
        </fieldset>
    )
}

// stable empty list so the selector doesnt return a new array each call
const noPlacements: EditorPlacement[] = []

// Html mounts into events.connected, which is the canvas, so point it at #ui instead
const uiPortal = { current: document.getElementById("ui") as HTMLElement }

function renderEntity(placement: EditorPlacement) {
    switch (placement.type) {
        case EntityType.TURRET:
            return <TurretModel rotation-y={placement.rotation} />
        case EntityType.TREE:
            return <TreeModel variant={placement.variant} rotation-y={placement.rotation} />
        default:
            return <Model type={placement.type} rotation-y={placement.rotation} />
    }
}

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
function SelectionBox({ placement, visible }: { placement: EditorPlacement, visible: boolean }) {
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
                <meshBasicMaterial wireframe color={"#ff0"} />
            </mesh>
        </group>
    )
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
                    placeAt(e.point.toArray())
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
                            <select
                                className="bg-transparent uppercase"
                                value={placement.type}
                                onChange={(e) => {
                                    const type = e.currentTarget.value

                                    setPlacementKind(
                                        placement.id,
                                        type === EntityType.TURRET ? defaultTurretKind
                                            : type === EntityType.TREE ? defaultTreeKind
                                                : { type: type as ModelType },
                                    )
                                }}
                            >
                                <optgroup label="Entities" className="bg-black">
                                    <option value={EntityType.TURRET} className="bg-black">
                                        {EntityType.TURRET}
                                    </option>
                                    <option value={EntityType.TREE} className="bg-black">
                                        {EntityType.TREE}
                                    </option>
                                </optgroup>
                                {Object.entries(modelGroups).map(([group, types]) => (
                                    <optgroup key={group} label={group} className="bg-black">
                                        {types.map(i => (
                                            <option key={i} value={i} className="bg-black">
                                                {i}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>

                            {placement.type === EntityType.TREE && (
                                <select
                                    className="bg-transparent uppercase"
                                    aria-label="Variant"
                                    value={placement.variant}
                                    onChange={(e) => {
                                        setPlacementKind(placement.id, {
                                            type: placement.type,
                                            variant: e.currentTarget.value as TreeType,
                                        })
                                    }}
                                >
                                    {treeVariants.map(([name, value]) => (
                                        <option key={value} value={value} className="bg-black">
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="flex justify-between">
                                    <span className="opacity-50">Rotation</span>
                                    {Math.round(placement.rotation * (180 / Math.PI))}&deg;
                                </label>
                                <input
                                    type="range"
                                    min={0}
                                    max={placement.type === EntityType.TURRET ? 270 : 315}
                                    step={placement.type === EntityType.TURRET ? 90 : 45}
                                    value={placement.rotation * (180 / Math.PI)}
                                    onChange={(e) => {
                                        updatePlacement(placement.id, { rotation: e.currentTarget.valueAsNumber * (Math.PI / 180) })
                                    }}
                                />
                            </div>

                            <VectorInput
                                legend="Position"
                                value={placement.position}
                                onUpdate={(position) => updatePlacement(placement.id, { position })}
                            />
                        </Html>
                    )}
                </group>
            ))}
        </>
    )
}

// with a model selected a click just deselects
export function placeAt(point: Tuple3) {
    if (useEditorStore.getState().activePlacementId) {
        setActivePlacement(null)
    } else {
        addPlacement(point)
    }
}
