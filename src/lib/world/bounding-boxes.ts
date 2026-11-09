import { ModelType } from "@components/model"
import { TreeType } from "@components/entities/tree/tree-model"
import { EntityType } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"

export type BoundingBoxKey = ModelType | TreeType | typeof EntityType.TURRET

export interface BoundingBox {
    min: Tuple3
    max: Tuple3
    size: Tuple3
    center: Tuple3
}

export const boundingBoxes: Partial<Record<BoundingBoxKey, [min: Tuple3, max: Tuple3]>> = {
    [ModelType.BASEMODULE_A]: [[-1.18, 0, -1], [1.07, 1, 1.18]],
    [ModelType.BASEMODULE_B]: [[-1.04, 0, -1.11], [1.04, 1, 1.21]],
    [ModelType.BASEMODULE_C]: [[-1, 0, -1], [1, 1, 1.21]],
    [ModelType.BASEMODULE_D]: [[-1.22, 0, -1.07], [1.22, 1, 1.07]],
    [ModelType.BASEMODULE_E]: [[-1.11, 0, -1.07], [1.11, 1.65, 1.21]],
    [ModelType.BASEMODULE_GARAGE_DOOR]: [[-.35, .15, .85], [.35, .85, .95]],
    [ModelType.BASEMODULE_GARAGE]: [[-1, 0, -1.1], [1, 1, 1.28]],
    [ModelType.CARGO_A_PACKED]: [[-.26, -.01, -.26], [.26, .52, .26]],
    [ModelType.CARGO_A_STACKED]: [[-.51, -.01, -.51], [.51, 1.01, .51]],
    [ModelType.CARGO_A]: [[-.25, 0, -.26], [.25, .52, .26]],
    [ModelType.CARGO_B_PACKED]: [[-.26, -.01, -.26], [.26, .52, .26]],
    [ModelType.CARGO_B_STACKED]: [[-.51, -.01, -.51], [.51, 1.01, .51]],
    [ModelType.CARGO_B]: [[-.25, 0, -.26], [.25, .52, .26]],
    [ModelType.CARGODEPOT_A]: [[-1.07, 0, -1.07], [1, 1.12, 1.01]],
    [ModelType.CARGODEPOT_B]: [[-1.07, 0, -1.11], [1.01, 1.02, 1.07]],
    [ModelType.CARGODEPOT_C]: [[-1.06, 0, -1], [1.01, 1.02, 1.1]],
    [ModelType.CONTAINERS_A]: [[-.25, 0, -.25], [.25, .2, .25]],
    [ModelType.CONTAINERS_B]: [[-.25, 0, -.25], [.25, .2, .25]],
    [ModelType.CONTAINERS_C]: [[-.25, 0, -.25], [.25, .2, .25]],
    [ModelType.CONTAINERS_D]: [[-.25, 0, -.25], [.25, .2, .25]],
    [ModelType.DOME]: [[-.95, 0, -.95], [.95, 1, .95]],
    [ModelType.DRILL_MODULE]: [[-.57, -.87, -.57], [.57, .6, .57]],
    [ModelType.DRILL_STRUCTURE]: [[-.88, 0, -.88], [.88, 2, .88]],
    [ModelType.DROPSHIP_PACKED]: [[-1.12, 0, -1.2], [1.12, 2.23, 1.1]],
    [ModelType.DROPSHIP]: [[-.75, 0, -1], [.75, .95, 1.1]],
    [ModelType.ECO_MODULE]: [[-1, 0, -1], [1, 2, 1]],
    [ModelType.LANDER_A]: [[-.67, 0, -.67], [.7, 1.19, .75]],
    [ModelType.LANDER_B]: [[-.67, 0, -.67], [.7, 1.1, .75]],
    [ModelType.LANDER_BASE]: [[-.67, 0, -.67], [.67, .5, .67]],
    [ModelType.LANDINGPAD_LARGE]: [[-1.25, 0, -1.25], [1.25, .5, 1.25]],
    [ModelType.LANDINGPAD_SMALL]: [[-.95, 0, -.95], [.95, .5, .95]],
    [ModelType.LIGHTS]: [[-.34, 0, -.34], [.34, 1, .34]],
    [ModelType.MOBILE_BASE_CARGO_ASSEMBLED]: [[-1, 0, -1.02], [1, 1.81, 1.02]],
    [ModelType.MOBILE_BASE_CARGO]: [[-.9, 0, -1.01], [.9, 1.31, 1.01]],
    [ModelType.MOBILE_BASE_CARRIAGE_ASSEMBLED]: [[-1.07, 0, -1.11], [1.07, 1.8, 1.11]],
    [ModelType.MOBILE_BASE_CARRIAGE]: [[-1.07, 0, -1.11], [1.07, 1.3, 1.11]],
    [ModelType.MOBILE_BASE_COMMAND_ASSEMBLED]: [[-1.07, 0, -1.11], [1.07, 1.8, 1.02]],
    [ModelType.MOBILE_BASE_COMMAND]: [[-1.07, 0, -1.11], [1.07, 1.3, 1]],
    [ModelType.MOBILE_BASE_FRAME]: [[-1, 0, -1.02], [1, .5, 1.02]],
    [ModelType.ROCK_A]: [[-.22, 0, -.25], [.32, .25, .25]],
    [ModelType.ROCK_B]: [[-.35, 0, -.4], [.35, .4, .4]],
    [ModelType.ROCKS_A]: [[-.79, 0, -.82], [.52, .35, .82]],
    [ModelType.ROCKS_B]: [[-.95, 0, -.88], [.93, 1.07, .86]],
    [ModelType.ROOFMODULE_BASE]: [[-.7, -.1, -.7], [.7, .1, .7]],
    [ModelType.ROOFMODULE_CARGO_A]: [[-.7, -.1, -.7], [.7, .62, .7]],
    [ModelType.ROOFMODULE_CARGO_B]: [[-.7, -.1, -.7], [.7, 1.12, .7]],
    [ModelType.ROOFMODULE_CARGO_C]: [[-.7, -.1, -.7], [.7, 1.12, .7]],
    [ModelType.ROOFMODULE_SOLARPANELS]: [[-.7, -.1, -.7], [.7, .47, .7]],
    [ModelType.SOLARPANEL]: [[-.45, 0, -.23], [.45, .37, .22]],
    [ModelType.SPRINKLER]: [[-.8, .25, -.17], [.8, .5, .1]],
    [ModelType.SPACE_FARM_LARGE_SPRINKLER]: [[-1, 0, -1], [1, .35, 1]],
    [ModelType.SPACE_FARM_LARGE]: [[-1, 0, -1], [1, .3, 1]],
    [ModelType.SPACE_FARM_SMALL]: [[-.7, -.1, -.7], [.7, .84, .7]],
    [ModelType.STRUCTURE_LOW]: [[-.88, 0, -.88], [.88, 1, .88]],
    [ModelType.STRUCTURE_TALL]: [[-.88, 0, -.88], [.88, 2, .88]],
    [ModelType.TUNNEL_DIAGONAL_LONG_A]: [[-1.47, .2, -1.47], [1.47, .8, 1.47]],
    [ModelType.TUNNEL_DIAGONAL_LONG_B]: [[-1.47, .2, -1.47], [1.47, .8, 1.47]],
    [ModelType.TUNNEL_DIAGONAL_SHORT_A]: [[-.47, .2, -.47], [.47, .8, .47]],
    [ModelType.TUNNEL_DIAGONAL_SHORT_B]: [[-.47, .2, -.47], [.47, .8, .47]],
    [ModelType.TUNNEL_STRAIGHT_A]: [[-1, .2, -.47], [1, .8, .47]],
    [ModelType.TUNNEL_STRAIGHT_B]: [[-1, .2, -.4], [1, .8, .4]],
    [ModelType.WATER_STORAGE]: [[-1, 0, -1], [1, 1.05, 1.05]],
    [ModelType.WINDTURBINE_LOW_FAN]: [[-.5, -.58, -.65], [.5, .57, .65]],
    [ModelType.WINDTURBINE_LOW]: [[-.57, 0, -.57], [.57, .5, .57]],
    [ModelType.WINDTURBINE_TALL_FAN]: [[-.83, -.49, -.55], [.83, .95, .45]],
    [ModelType.WINDTURBINE_TALL]: [[-.34, 0, -.34], [.34, 1.72, .34]],
    [TreeType.TYPE3_01]: [[-.78, -.02, -.98], [1.07, 2.89, .65]],
    [TreeType.TYPE3_02]: [[-1.26, -.02, -1.03], [1.31, 2.89, 1.01]],
    [TreeType.TYPE3_03]: [[-1.51, -.01, -1.09], [1.38, 2.83, 1.23]],
    [TreeType.TYPE3_04]: [[-.88, 0, -.58], [.8, 2.89, .51]],
    [TreeType.TYPE3_05]: [[-.71, 0, -.59], [.89, 2.89, .52]],
    [TreeType.TYPE4_01]: [[-.71, -.02, -1.01], [.98, 2.89, .84]],
    [TreeType.TYPE4_02]: [[-.76, -.02, -.99], [.76, 2.89, .94]],
    [TreeType.TYPE4_03]: [[-.97, 0, -.79], [1.14, 2.89, .89]],
    [TreeType.TYPE4_04]: [[-.64, 0, -.47], [.49, 2.89, .54]],
    [TreeType.TYPE4_05]: [[-.66, 0, -.58], [.67, 2.89, .55]],
    [TreeType.TYPE5_01]: [[-.77, -.02, -.47], [1.25, 2.89, 1.09]],
    [TreeType.TYPE5_02]: [[-1.07, 0, -.53], [.81, 2.89, .83]],
    [TreeType.TYPE5_03]: [[-.6, 0, -.63], [.81, 2.89, .55]],
    [TreeType.TYPE5_04]: [[-1.19, 0, -.89], [1.08, 2.89, .67]],
    [TreeType.TYPE7_01]: [[-1.39, -.02, -1.39], [1.5, 2.59, 1.49]],
    [TreeType.TYPE7_02]: [[-.88, -.12, -.93], [1.21, 2.89, .91]],
    [TreeType.TYPE7_03]: [[-1.06, 0, -1.07], [1.15, 2.89, 1.14]],
    [TreeType.TYPE7_04]: [[-.25, -.14, -1], [1.51, 2.89, .99]],
    [EntityType.TURRET]: [[-.92, 0, -.44], [1.55, .84, .46]],
}

export function getBoundingBox(key: BoundingBoxKey): BoundingBox | undefined {
    const box = boundingBoxes[key]

    if (!box) {
        return
    }

    const [min, max] = box

    return {
        min,
        max,
        size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
        center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    }
}

export interface CollisionBox {
    // box center from the model origin
    offset: Tuple3
    size: Tuple3
}

// bounding box turned by the nearest quarter turn of rotation, collisions are never rotated
// so anything in between keeps the 90 deg box instead of growing to fit
export function getCollisionBox(key: BoundingBoxKey, rotation: number): CollisionBox {
    const box = getBoundingBox(key)

    if (!box) {
        throw new Error(`No bounding box for ${key}`)
    }

    const { size, center } = box
    const snapped = Math.round(rotation / (Math.PI / 2)) * Math.PI / 2
    // exact 0 or ±1
    const cos = Math.round(Math.cos(snapped))
    const sin = Math.round(Math.sin(snapped))

    return {
        offset: [
            center[0] * cos + center[2] * sin,
            center[1],
            center[2] * cos - center[0] * sin,
        ],
        size: [
            size[0] * Math.abs(cos) + size[2] * Math.abs(sin),
            size[1],
            size[0] * Math.abs(sin) + size[2] * Math.abs(cos),
        ],
    }
}
