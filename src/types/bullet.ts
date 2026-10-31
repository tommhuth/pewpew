import { ColorRepresentation } from "three"
import LineSegment from "@lib/helpers/line-segment"

export const Owner = {
    PLAYER: "player",
    ENEMY: "enemy",
} as const

export type Owner = typeof Owner[keyof typeof Owner]

export interface Bullet {
    id: string
    speed: number
    index: number
    lightIndex: number
    rotation: number
    mounted: boolean
    color: ColorRepresentation
    owner: Owner
    line: LineSegment
}
