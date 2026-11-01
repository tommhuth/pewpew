import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { DepthTexture, Object3D, Vector3 } from "three"
import { WorldPart } from "@src/types/world"
import { Entity } from "@src/types/entity"
import { PLAYER_SPEED, WORLD_CENTER_X } from "./const"
import { getNextWorldPart } from "./world/world"
import { SpatialHashGrid3D } from "./helpers/spatial-hash-grid-3d"

export const State = {
    LOADING: "loading",
    READY: "ready",
} as const

export type State = typeof State[keyof typeof State]

interface Store {
    state: State
    loading: boolean
    // scene depth without depth-ignored objects, set by useRenderer
    depthTexture: DepthTexture | null
    debug: {
        hitboxes: boolean
    }
    world: {
        grid: SpatialHashGrid3D
        parts: WorldPart[]
        entities: Entity[]
    }
    player: {
        keys: Record<string, boolean>
        speed: number
        position: Vector3
        targetPosition: Vector3
        object: Object3D | null
    }
}

const useStore = create(
    subscribeWithSelector<Store>(() => ({
        state: State.LOADING,
        loading: true,
        depthTexture: null,
        debug: {
            hitboxes: false,
        },
        world: {
            grid: new SpatialHashGrid3D([4, 4, 4]),
            parts: [],
            entities: [],
        },
        player: {
            keys: {},
            speed: PLAYER_SPEED,
            position: new Vector3(),
            targetPosition: new Vector3(WORLD_CENTER_X, 0, 0),
            object: null,
        },
    } satisfies Store))
)

export function setState(partial: Partial<Store>) {
    useStore.setState(partial)
}

export function setDebugHitboxes(hitboxes: boolean) {
    useStore.setState({
        debug: {
            ...useStore.getState().debug,
            hitboxes,
        }
    })
}

export function setPlayerObject(object: Object3D | null) {
    useStore.setState({
        player: {
            ...useStore.getState().player,
            object,
        }
    })
}

export function addWorldPart(part?: WorldPart) {
    const world = useStore.getState().world
    const lastPart = world.parts[world.parts.length - 1]

    useStore.setState({
        world: {
            ...world,
            parts: [...world.parts, part || getNextWorldPart(lastPart)],
        }
    })
}

export function removeWorldPart(id: string) {
    const world = useStore.getState().world

    useStore.setState({
        world: {
            ...world,
            parts: world.parts.filter(i => i.id !== id),
        }
    })
}

export function addEntities(entities: Entity[]) {
    const world = useStore.getState().world

    useStore.setState({
        world: {
            ...world,
            entities: [...world.entities, ...entities],
        }
    })
}

export function removeEntities(ids: string[]) {
    const world = useStore.getState().world
    const remove = new Set(ids)

    useStore.setState({
        world: {
            ...world,
            entities: world.entities.filter(i => !remove.has(i.id)),
        }
    })
}

export function removePartEntities(partId: string) {
    const world = useStore.getState().world

    useStore.setState({
        world: {
            ...world,
            entities: world.entities.filter(i => i.partId !== partId),
        }
    })
}

export function setEntitiesFalling(ids: string[]) {
    const world = useStore.getState().world
    const falling = new Set(ids)

    useStore.setState({
        world: {
            ...world,
            entities: world.entities.map(i => falling.has(i.id) ? { ...i, falling: true } : i),
        }
    })
}

// for damage from the outside by id, returns true if this hit killed it
// no store update, the entity reacts through health.onChange
export function damageEntity(id: string, damage: number) {
    const entity = useStore.getState().world.entities.find(i => i.id === id)

    return entity ? entity.health.decrease(damage) : false
}

export { useStore }
