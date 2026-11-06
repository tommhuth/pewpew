import { BoxGeometry, Vector3 } from "three"
import { Tuple3 } from "@src/types/global"
import { cellsize, d } from "@lib/world/terrain"

// world bounds the player can move within
export const WORLD_CENTER_X = 0
export const WORLD_LEFT_EDGE = 5.5
export const WORLD_RIGHT_EDGE = -5.5
export const WORLD_TOP_EDGE = 5
export const WORLD_BOTTOM_EDGE = .5

export const EDGE_MIN = new Vector3(WORLD_RIGHT_EDGE, WORLD_BOTTOM_EDGE, -Infinity)
export const EDGE_MAX = new Vector3(WORLD_LEFT_EDGE, WORLD_TOP_EDGE, Infinity)

export const CAMERA_Y = 50
export const CAMERA_OFFSET = new Vector3(6.85, 0, 6)

// https://discourse.threejs.org/t/dimetric-orthographic-camera-angle-for-retro-pixel-look/24455/2
export const CAMERA_DIRECTION = new Vector3().setFromSphericalCoords(
    CAMERA_Y,
    -Math.PI / 3, // 60 degrees from positive Y-axis and 30 degrees to XZ-plane
    Math.PI / 4 // 45 degrees, between positive X and Z axes, thus on XZ-plane
)

export const PLAYER_START: Tuple3 = [WORLD_CENTER_X, 1.5, 0]
export const PLAYER_SIZE: Tuple3 = [.8, .4, 1.25]
export const PLAYER_SPEED = 3
// min gap between the bottom of the player box and the terrain
export const PLAYER_TERRAIN_BUFFER = .3

// first part starts two part depths behind the player
export const WORLD_START_Z = -d * cellsize * 2

// shared unit box, scale it per use
export const box = new BoxGeometry(1, 1, 1, 1, 1, 1)

export const BULLET_SIZE = 1.25
export const BULLET_SPEED = 40
export const BULLET_COUNT = 40
// ms between shots
export const FIRE_FREQUENCY = 150

// explosion instance pools
export const FIREBALL_COUNT = 600
export const SHOCKWAVE_COUNT = 25
export const PARTICLE_COUNT = 900
export const DECAL_COUNT = 30
export const SMOKE_COUNT = 100
export const LEAF_COUNT = 150
