import { EntityType } from "./entity"

// what a grid client is, world entities plus the player
export const CollisionType = {
    ...EntityType,
    PLAYER: "player",
} as const

export type CollisionType = typeof CollisionType[keyof typeof CollisionType]
