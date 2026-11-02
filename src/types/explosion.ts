import { ColorRepresentation } from "three"
import { Tuple3 } from "./global"

// times and lifetimes are ms, negative time delays the start
export interface Fireball {
    position: Tuple3
    index: number
    startRadius: number
    maxRadius: number
    lifetime: number
    time: number
}

export interface Shockwave {
    radius: number
    lifetime: number
    time: number
    index: number
}

export interface Explosion {
    id: string
    position: Tuple3
    lifetime: number
    time: number
    mounted: boolean
    shockwave: Shockwave | null
    fireballs: Fireball[]
}

// scorch mark, flat on the ground
export interface Decal {
    position: Tuple3
    time: number
    lifetime: number
    rotation: number
    scale: number
    index: number
}

export interface Particle {
    position: Tuple3
    velocity: Tuple3
    acceleration: Tuple3
    rotation: Tuple3
    friction: number
    restitution: number
    radius: number
    color: ColorRepresentation
    index: number
    // ms, negative delays the start
    time: number
    mounted: boolean
}
