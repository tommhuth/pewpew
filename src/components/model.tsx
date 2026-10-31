import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { Mesh } from "three"
import { spacebits } from "@lib/materials"
import modelsModel from "@assets/models/models.glb"

export enum ModelType {
    BASEMODULE_A = "basemodule_A",
    BASEMODULE_B = "basemodule_B",
    BASEMODULE_C = "basemodule_C",
    BASEMODULE_D = "basemodule_D",
    BASEMODULE_E = "basemodule_E",
    BASEMODULE_GARAGE_DOOR = "basemodule_garage_door",
    BASEMODULE_GARAGE = "basemodule_garage",
    CARGO_A_PACKED = "cargo_A_packed",
    CARGO_A_STACKED = "cargo_A_stacked",
    CARGO_A = "cargo_A",
    CARGO_B_PACKED = "cargo_B_packed",
    CARGO_B_STACKED = "cargo_B_stacked",
    CARGO_B = "cargo_B",
    CARGODEPOT_A = "cargodepot_A",
    CARGODEPOT_B = "cargodepot_B",
    CARGODEPOT_C = "cargodepot_C",
    CONTAINERS_A = "containers_A",
    CONTAINERS_B = "containers_B",
    CONTAINERS_C = "containers_C",
    CONTAINERS_D = "containers_D",
    DOME = "dome",
    DRILL_MODULE = "drill_module",
    DRILL_STRUCTURE = "drill_structure",
    DROPSHIP_PACKED = "dropship_packed",
    DROPSHIP_DOOR_LEFT = "dropship_door_left",
    DROPSHIP_DOOR_RIGHT = "dropship_door_right",
    DROPSHIP = "dropship",
    LANDER_A = "lander_A",
    LANDER_B = "lander_B",
    LANDER_BASE = "lander_base",
    LANDINGPAD_LARGE = "landingpad_large",
    LANDINGPAD_SMALL = "landingpad_small",
    LIGHTS = "lights",
    MOBILE_BASE_CARGO = "mobile_base_cargo",
    MOBILE_BASE_CARRIAGE = "mobile_base_carriage",
    MOBILE_BASE_COMMAND = "mobile_base_command",
    MOBILE_BASE_FRAME_WHEEL_LEFT_FRONT = "mobile_base_frame_wheel_left_front",
    MOBILE_BASE_FRAME_WHEEL_LEFT_MIDDLE = "mobile_base_frame_wheel_left_middle",
    MOBILE_BASE_FRAME_WHEEL_LEFT_REAR = "mobile_base_frame_wheel_left_rear",
    MOBILE_BASE_FRAME_WHEEL_RIGHT_FRONT = "mobile_base_frame_wheel_right_front",
    MOBILE_BASE_FRAME_WHEEL_RIGHT_MIDDLE = "mobile_base_frame_wheel_right_middle",
    MOBILE_BASE_FRAME_WHEEL_RIGHT_REAR = "mobile_base_frame_wheel_right_rear",
    MOBILE_BASE_FRAME = "mobile_base_frame",
    ROCK_A = "rock_A",
    ROCK_B = "rock_B",
    ROCKS_A = "rocks_A",
    ROCKS_B = "rocks_B",
    ROOFMODULE_BASE = "roofmodule_base",
    ROOFMODULE_CARGO_A = "roofmodule_cargo_A",
    ROOFMODULE_CARGO_B = "roofmodule_cargo_B",
    ROOFMODULE_CARGO_C = "roofmodule_cargo_C",
    ROOFMODULE_SOLARPANELS = "roofmodule_solarpanels",
    SOLARPANEL = "solarpanel",
    SPRINKLER = "sprinkler",
    SPACE_FARM_LARGE_SPRINKLER = "space_farm_large_sprinkler",
    SPACE_FARM_LARGE = "space_farm_large",
    SPACE_FARM_SMALL = "space_farm_small",
    /*
    SPACETRUCK_LARGE_WHEEL_FRONT_LEFT = "spacetruck_large_wheel_front_left",
    SPACETRUCK_LARGE_WHEEL_FRONT_RIGHT = "spacetruck_large_wheel_front_right",
    SPACETRUCK_LARGE_WHEEL_REAR_LEFT = "spacetruck_large_wheel_rear_left",
    SPACETRUCK_LARGE_WHEEL_REAR_RIGHT = "spacetruck_large_wheel_rear_right",
    */
    SPACETRUCK_LARGE = "spacetruck_large",
    /*
    SPACETRUCK_TRAILER_WHEEL_FRONT_LEFT = "spacetruck_trailer_wheel_front_left",
    SPACETRUCK_TRAILER_WHEEL_FRONT_RIGHT = "spacetruck_trailer_wheel_front_right",
    SPACETRUCK_TRAILER_WHEEL_REAR_LEFT = "spacetruck_trailer_wheel_rear_left",
    SPACETRUCK_TRAILER_WHEEL_REAR_RIGHT = "spacetruck_trailer_wheel_rear_right",
    */
    SPACETRUCK_TRAILER = "spacetruck_trailer",
    /*
    SPACETRUCK_WHEEL_FRONT_LEFT = "spacetruck_wheel_front_left",
    SPACETRUCK_WHEEL_FRONT_RIGHT = "spacetruck_wheel_front_right",
    SPACETRUCK_WHEEL_REAR_LEFT = "spacetruck_wheel_rear_left",
    SPACETRUCK_WHEEL_REAR_RIGHT = "spacetruck_wheel_rear_right",
    */
    SPACETRUCK = "spacetruck",
    STRUCTURE_LOW = "structure_low",
    STRUCTURE_TALL = "structure_tall",
    TERRAIN_LOW_CURVED = "terrain_low_curved",
    TUNNEL_DIAGONAL_LONG_A = "tunnel_diagonal_long_A",
    TUNNEL_DIAGONAL_LONG_B = "tunnel_diagonal_long_B",
    TUNNEL_DIAGONAL_SHORT_A = "tunnel_diagonal_short_A",
    TUNNEL_DIAGONAL_SHORT_B = "tunnel_diagonal_short_B",
    TUNNEL_STRAIGHT_A = "tunnel_straight_A",
    TUNNEL_STRAIGHT_B = "tunnel_straight_B",
    WATER_STORAGE = "water_storage",
    WINDTURBINE_LOW_FAN = "windturbine_low_fan",
    WINDTURBINE_LOW = "windturbine_low",
    WINDTURBINE_TALL_FAN = "windturbine_tall_fan",
    WINDTURBINE_TALL = "windturbine_tall",
}

const wheels = Object.values(ModelType).filter(i => i.includes("_wheel_"))

// terrain_* is left out, ground.glb covers it
export const modelGroups: Record<string, ModelType[]> = {
    "Base": [
        ModelType.BASEMODULE_A,
        ModelType.BASEMODULE_B,
        ModelType.BASEMODULE_C,
        ModelType.BASEMODULE_D,
        ModelType.BASEMODULE_E,
        ModelType.BASEMODULE_GARAGE,
        ModelType.DOME,
        ModelType.STRUCTURE_LOW,
        ModelType.STRUCTURE_TALL,
        ModelType.TUNNEL_STRAIGHT_A,
        ModelType.TUNNEL_STRAIGHT_B,
        ModelType.TUNNEL_DIAGONAL_SHORT_A,
        ModelType.TUNNEL_DIAGONAL_SHORT_B,
        ModelType.TUNNEL_DIAGONAL_LONG_A,
        ModelType.TUNNEL_DIAGONAL_LONG_B,
    ],
    "Roof": [
        ModelType.ROOFMODULE_BASE,
        ModelType.ROOFMODULE_CARGO_A,
        ModelType.ROOFMODULE_CARGO_B,
        ModelType.ROOFMODULE_CARGO_C,
        ModelType.ROOFMODULE_SOLARPANELS,
    ],
    "Utilities": [
        ModelType.SOLARPANEL,
        ModelType.WINDTURBINE_LOW,
        ModelType.WINDTURBINE_TALL,
        ModelType.WATER_STORAGE,
        ModelType.DRILL_STRUCTURE,
        ModelType.SPACE_FARM_SMALL,
        ModelType.SPACE_FARM_LARGE,
        ModelType.LIGHTS,
        ModelType.SPRINKLER,
        ModelType.SPACE_FARM_LARGE_SPRINKLER,
    ],
    "Cargo": [
        ModelType.CARGO_A,
        ModelType.CARGO_A_PACKED,
        ModelType.CARGO_A_STACKED,
        ModelType.CARGO_B,
        ModelType.CARGO_B_PACKED,
        ModelType.CARGO_B_STACKED,
        ModelType.CARGODEPOT_A,
        ModelType.CARGODEPOT_B,
        ModelType.CARGODEPOT_C,
        ModelType.CONTAINERS_A,
        ModelType.CONTAINERS_B,
        ModelType.CONTAINERS_C,
        ModelType.CONTAINERS_D,
    ],
    "Vehicles": [
        ModelType.MOBILE_BASE_FRAME,
        ModelType.MOBILE_BASE_CARRIAGE,
        ModelType.MOBILE_BASE_CARGO,
        ModelType.MOBILE_BASE_COMMAND,
    ],
    "Aircraft": [
        ModelType.DROPSHIP,
        ModelType.DROPSHIP_PACKED,
        ModelType.LANDER_A,
        ModelType.LANDER_B,
        ModelType.LANDER_BASE,
        ModelType.LANDINGPAD_SMALL,
        ModelType.LANDINGPAD_LARGE,
    ],
    "Nature": [
        ModelType.ROCK_A,
        ModelType.ROCK_B,
        ModelType.ROCKS_A,
        ModelType.ROCKS_B,
    ],
    "Parts": [
        ModelType.BASEMODULE_GARAGE_DOOR,
        ModelType.DRILL_MODULE,
        ModelType.WINDTURBINE_LOW_FAN,
        ModelType.WINDTURBINE_TALL_FAN,
    ],
}

type ModelProps = { type: ModelType } & ThreeElements["mesh"]

export default function Model({ type, ...rest }: ModelProps) {
    const { nodes } = useGLTF(modelsModel) as unknown as { nodes: Record<ModelType, Mesh> }

    return (
        <mesh
            geometry={nodes[type].geometry}
            material={spacebits}
            castShadow
            receiveShadow
            {...rest}
        />
    )
}

useGLTF.preload(modelsModel)
