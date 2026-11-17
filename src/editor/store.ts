import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import random from "@huth/random"
import { MAP_DEPTH, TerrainCell, TerrainType, Terrain, MAP_WIDTH } from "@lib/world/terrain"
import { ModelType } from "@components/model"
import { Tuple3 } from "@src/types/global"
import { CAMERA_DIRECTION, CAMERA_OFFSET } from "@lib/const"
import { terrainsByName } from "./terrain/terrain-loader"
import { DistributiveOmit, EditorMap, EditorMode, EditorPlacement, PlacementKind } from "./editor-types"
import { PLACEMENT_PRECISION } from "./editor-const"
import { storedMaps } from "@lib/world/maps-loader"

interface EditorStore {
    mode: EditorMode
    maps: Record<string, EditorMap>
    map: string | null
    terrainPreset: string
    brush: TerrainType
    cameraPosition: Tuple3
    previousKind: PlacementKind
    activePlacementId: string | null
}

export function roundToNearest(value: number, nearest: number) {
    return Math.round(value / nearest) * nearest
}

function emptyTerrain(): Terrain {
    return Array.from({ length: MAP_DEPTH })
        .map(() => Array.from({ length: MAP_WIDTH }).map(() => ({ type: TerrainType.LOW, rotation: 0 })))
}

function copyTerrain(terrain: Terrain) {
    return terrain.map(row => row.map(cell => ({ ...cell })))
}

const useEditorStore = create(
    subscribeWithSelector<EditorStore>(() => ({
        mode: EditorMode.PLACEMENT,
        maps: storedMaps,
        map: Object.keys(storedMaps)[0] ?? null,
        terrainPreset: Object.keys(terrainsByName)[0] ?? "",
        brush: TerrainType.TALL,
        cameraPosition: [
            CAMERA_DIRECTION.x + CAMERA_OFFSET.x - 3,
            CAMERA_DIRECTION.y,
            CAMERA_DIRECTION.z + CAMERA_OFFSET.z,
        ],
        previousKind: { type: ModelType.BASEMODULE_A },
        activePlacementId: null,
    }))
)

export function getCurrentMap() {
    const { maps, map } = useEditorStore.getState()

    return map ? maps[map] ?? null : null
}

function updateMap(update: (map: EditorMap) => Partial<EditorMap>) {
    const { maps, map } = useEditorStore.getState()
    const current = getCurrentMap()

    if (!map || !current) {
        return
    }

    useEditorStore.setState({
        maps: {
            ...maps,
            [map]: {
                ...current,
                ...update(current)
            }
        }
    })
}

function updateCell(x: number, z: number, update: (cell: TerrainCell) => TerrainCell) {
    updateMap(({ terrain }) => {
        const next = terrain.map(row => row.slice())

        next[z][x] = update(next[z][x])

        return { terrain: next }
    })
}

export function paintCell(x: number, z: number) {
    const { brush } = useEditorStore.getState()

    updateCell(x, z, cell => ({ ...cell, type: brush }))
}

export function rotateCell(x: number, z: number) {
    updateCell(x, z, cell => ({ ...cell, rotation: (cell.rotation + 1) % 4 as TerrainCell["rotation"] }))
}

export function setBrush(brush: TerrainType) {
    useEditorStore.setState({ brush })
}

export function moveCamera([dx, , dz]: Tuple3) {
    const [x, y, z] = useEditorStore.getState().cameraPosition

    useEditorStore.setState({ cameraPosition: [x + dx, y, z + dz] })
}

export function resetTerrain() {
    updateMap(() => ({ terrain: emptyTerrain() }))
}

export function setTerrainPreset(terrainPreset: string) {
    const preset = terrainsByName[terrainPreset]

    // copies the preset into the current map, and new maps start from it
    useEditorStore.setState({ terrainPreset })

    if (preset) {
        updateMap(() => ({ terrain: copyTerrain(preset) }))
    }
}

export function selectMap(map: string) {
    useEditorStore.setState({ map, activePlacementId: null })
}

export function createMap(name: string) {
    const { maps, terrainPreset } = useEditorStore.getState()
    const preset = terrainsByName[terrainPreset]

    useEditorStore.setState({
        maps: {
            ...maps,
            [name]: {
                terrain: preset ? copyTerrain(preset) : emptyTerrain(),
                placements: []
            },
        },
        map: name,
        activePlacementId: null,
    })
}

export function setMode(mode: EditorMode) {
    useEditorStore.setState({ mode, activePlacementId: null })
}

export function createPlacement([x, y, z]: Tuple3) {
    const id = random.id()
    const { previousKind: kind } = useEditorStore.getState()

    updateMap(({ placements }) => ({
        placements: [
            ...placements,
            {
                ...kind,
                id,
                position: [
                    roundToNearest(x, PLACEMENT_PRECISION),
                    y,
                    roundToNearest(z, PLACEMENT_PRECISION)
                ],
                rotation: 0,
            }
        ],
    }))
    useEditorStore.setState({ activePlacementId: id })
}

export function updatePlacement(
    id: string,
    data: Partial<DistributiveOmit<EditorPlacement, "id" | "type">>
) {
    updateMap(({ placements }) => ({
        placements: placements.map(i => i.id === id ? { ...i, ...data } : i),
    }))
}

// resets to new placement keeping only shared
export function setPlacementKind(id: string, kind: PlacementKind) {
    updateMap(({ placements }) => ({
        placements: placements.map(i => i.id !== id ? i : {
            ...kind,
            id: i.id,
            position: i.position,
            rotation: i.rotation,
        }),
    }))
    useEditorStore.setState({ previousKind: kind })
}

export function removePlacement(id: string) {
    const { activePlacementId } = useEditorStore.getState()

    updateMap(({ placements }) => ({ placements: placements.filter(i => i.id !== id) }))

    useEditorStore.setState({
        activePlacementId: activePlacementId === id ? null : activePlacementId
    })
}

export function setActivePlacement(activePlacementId: string | null) {
    useEditorStore.setState({ activePlacementId })
}

export { useEditorStore }
