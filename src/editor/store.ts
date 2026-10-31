import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import random from "@huth/random"
import { d, TerrainCell, GroundType, Terrain, w } from "@lib/terrain"
import { ModelType } from "@components/model"
import { TreeType } from "@components/world/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"
import { terrainsByName } from "./terrain/terrains"
import { StoredMap, storedMaps } from "./maps"

export const EditorMode = {
    TERRAIN: "terrain",
    PLACEMENT: "placement",
} as const

export type EditorMode = typeof EditorMode[keyof typeof EditorMode]

interface PlacementTransform {
    id: string
    position: Tuple3
    rotation: number
}

// what gets placed
export type PlacementKind =
    | { type: ModelType }
    | { type: typeof EntityType.TURRET }
    | { type: typeof EntityType.TREE, variant: TreeType }

export type EditorPlacement = PlacementTransform & PlacementKind

export interface EditorMap {
    terrain: Terrain
    placements: EditorPlacement[]
}

interface EditorStore {
    mode: EditorMode
    // all maps, by file name, save writes them back to assets/maps/map
    maps: Record<string, EditorMap>
    map: string | null
    terrainPreset: string
    brush: GroundType
    cameraZ: number
    // last picked, new placements copy it
    kind: PlacementKind
    activePlacementId: string | null
}

export const PLACEMENT_PRECISION = .25

export const defaultTurretKind: PlacementKind = {
    type: EntityType.TURRET,
}

export const defaultTreeKind: PlacementKind = {
    type: EntityType.TREE,
    variant: TreeType.TYPE3_01,
}

export function roundToNearest(value: number, nearest: number) {
    return Math.round(value / nearest) * nearest
}

function emptyTerrain(): Terrain {
    return Array.from({ length: d })
        .map(() => Array.from({ length: w }).map(() => ({ type: GroundType.LOW, rotation: 0 })))
}

function copyTerrain(terrain: Terrain) {
    return terrain.map(row => row.map(cell => ({ ...cell })))
}

function fromStoredMap(stored: StoredMap): EditorMap {
    return {
        terrain: stored.terrain,
        placements: stored.placements
    }
}

export function toStoredMap(map: EditorMap): StoredMap {
    return {
        terrain: map.terrain,
        placements: map.placements.map(i => {
            return i
        }),
    }
}

const initialMaps = Object.fromEntries(Object.entries(storedMaps).map(([name, stored]) => [name, fromStoredMap(stored)]))

const useEditorStore = create(
    subscribeWithSelector<EditorStore>(() => ({
        mode: EditorMode.PLACEMENT,
        maps: initialMaps,
        map: Object.keys(initialMaps)[0] ?? null,
        terrainPreset: Object.keys(terrainsByName)[0] ?? "",
        brush: GroundType.TALL,
        cameraZ: 0,
        kind: { type: ModelType.BASEMODULE_A },
        activePlacementId: null,
    }))
)

export function getCurrentMap() {
    const { maps, map } = useEditorStore.getState()

    return map ? maps[map] ?? null : null
}

// all edits go through here into the current map
function updateMap(update: (map: EditorMap) => Partial<EditorMap>) {
    const { maps, map } = useEditorStore.getState()
    const current = getCurrentMap()

    if (!map || !current) {
        return
    }

    useEditorStore.setState({ maps: { ...maps, [map]: { ...current, ...update(current) } } })
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

export function setBrush(brush: GroundType) {
    useEditorStore.setState({ brush })
}

export function setCameraZ(cameraZ: number) {
    useEditorStore.setState({ cameraZ })
}

export function resetTerrain() {
    updateMap(() => ({ terrain: emptyTerrain() }))
}

// copies the preset into the current map, and new maps start from it
export function setTerrainPreset(terrainPreset: string) {
    const preset = terrainsByName[terrainPreset]

    useEditorStore.setState({ terrainPreset })

    if (preset) {
        updateMap(() => ({ terrain: copyTerrain(preset) }))
    }
}

export function selectMap(map: string) {
    useEditorStore.setState({ map, activePlacementId: null })
}

// store only, written to disk on save
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

export function addPlacement([x, y, z]: Tuple3) {
    const id = random.id()
    const { kind } = useEditorStore.getState()

    updateMap(({ placements }) => ({
        placements: [...placements, {
            ...kind,
            id,
            position: [
                roundToNearest(x, PLACEMENT_PRECISION),
                y,
                roundToNearest(z, PLACEMENT_PRECISION)
            ],
            rotation: 0,
        }],
    }))
    useEditorStore.setState({ activePlacementId: id })
}

export function updatePlacement(id: string, data: Partial<Omit<PlacementTransform, "id">>) {
    updateMap(({ placements }) => ({
        placements: placements.map(i => i.id === id ? { ...i, ...data } : i),
    }))
}

// swaps what is placed, keeps where
export function setPlacementKind(id: string, kind: PlacementKind) {
    updateMap(({ placements }) => ({
        placements: placements.map(i => i.id !== id ? i : {
            ...kind,
            id: i.id,
            position: i.position,
            // turrets only turn in 90 deg steps
            rotation: kind.type === EntityType.TURRET
                ? roundToNearest(i.rotation, Math.PI / 2) % (Math.PI * 2)
                : i.rotation,
        }),
    }))
    useEditorStore.setState({ kind })
}

export function removePlacement(id: string) {
    const { activePlacementId } = useEditorStore.getState()

    updateMap(({ placements }) => ({ placements: placements.filter(i => i.id !== id) }))
    useEditorStore.setState({ activePlacementId: activePlacementId === id ? null : activePlacementId })
}

export function setActivePlacement(activePlacementId: string | null) {
    useEditorStore.setState({ activePlacementId })
}

export { useEditorStore }
