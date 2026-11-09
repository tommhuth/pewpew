import { Box3, Vector3 } from "three"
import { Client } from "@lib/helpers/spatial-hash-grid-3d"
import { useStore } from "@lib/store"
import { Bullet } from "@src/types/bullet"
import { Tuple3 } from "@src/types/global"

const _box = new Box3()
const _size = new Vector3()
const _center = new Vector3()
const _findNearSize: Tuple3 = [1.5, 1, 1.5]
const _collisions: Client[] = []

export interface CollisionEventDetails {
    client: Client
    point: Tuple3
    normal: Tuple3
    bullet: Bullet
}

declare global {
    interface WindowEventMap {
        bulletcollision: CustomEvent<CollisionEventDetails>
    }
}

let _point = new Vector3()
let _normal = new Vector3()

export function getBulletCollision(bullet: Bullet): [client: Client, normal: Vector3, point: Vector3] | null {
    const grid = useStore.getState().world.grid
    const near = grid.findNear(bullet.line.position, _findNearSize)

    for (let i = 0, n = near.length; i < n; i++) {
        const client = near[i]
        const p = client.position
        const s = client.size

        _center.set(p[0], p[1], p[2])
        _size.set(s[0], s[1], s[2])
        _box.setFromCenterAndSize(_center, _size)

        if (bullet.line.intersectsBox(_box, _normal, _point)) {
            return [client, _normal, _point] as const
        }
    }

    return null
}

// aabb overlap, positions are box centers
function intersects(a: Client, b: Client) {
    const ap = a.position
    const as = a.size
    const bp = b.position
    const bs = b.size

    return Math.abs(ap[0] - bp[0]) * 2 < as[0] + bs[0]
        && Math.abs(ap[1] - bp[1]) * 2 < as[1] + bs[1]
        && Math.abs(ap[2] - bp[2]) * 2 < as[2] + bs[2]
}

// clients overlapping this one, itself excluded
// returned array is reused across calls, do not retain past next getCollisions
export function getCollisions(client: Client) {
    const grid = useStore.getState().world.grid
    const near = grid.findNear(client.position, client.size)

    _collisions.length = 0

    for (let i = 0, n = near.length; i < n; i++) {
        const other = near[i]

        if (other !== client && intersects(client, other)) {
            _collisions.push(other)
        }
    }

    return _collisions
}

// false when a listener wants the bullet to keep going
export function dispatchCollisionEvent(detail: CollisionEventDetails) {
    return window.dispatchEvent(new CustomEvent<CollisionEventDetails>("bulletcollision", { detail, cancelable: true }))
}
