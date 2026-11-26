import { ModelType } from "@components/model"
import { TreeType, treeVariants } from "@components/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import { setPlacementKind, updatePlacement, useEditorStore } from "../store"
import { defaultPlantKind, defaultRocketKind, defaultTreeKind, defaultTurretKind } from "../editor-const"
import { ModelSelect } from "../model-select/model-select"
import { VectorInput } from "../vector-input/vector-input"
import { RangeInput } from "../range-input/range-input"

function makePlacementData(type: ModelType | EntityType) {
    switch (type) {
        case EntityType.TURRET:
            return defaultTurretKind
        case EntityType.TREE:
            return defaultTreeKind
        case EntityType.PLANT:
            return defaultPlantKind
        case EntityType.ROCKET:
            return defaultRocketKind
        default:
            return { type: type as ModelType }
    }
}

export default function PlacementPanel({ className = "" }: { className?: string }) {
    const placement = useEditorStore(i => {
        const placements = i.map ? i.maps[i.map]?.placements : undefined

        return placements?.find(p => p.id === i.activePlacementId)
    })

    if (!placement) {
        return null
    }

    return (
        <div className={`flex flex-col gap-4 p-3 rounded bg-black/50 backdrop-blur-xs font-mono text-xs text-white whitespace-nowrap ${className}`}>
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
        </div>
    )
}
