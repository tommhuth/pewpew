import { Box3, Vector3 } from "three"

const _direction = new Vector3()
const _halfLengthDirection = new Vector3()
const _start = new Vector3()
const _end = new Vector3()

export default class LineSegment {
    constructor(
        public readonly position: Vector3, // Center of the line segment
        public readonly direction: Vector3,
        public readonly length: number
    ) { }

    getStartPoint(target: Vector3): Vector3 {
        return target.subVectors(
            this.position,
            _halfLengthDirection.copy(this.direction).multiplyScalar(this.length / 2)
        )
    }

    getEndPoint(target: Vector3): Vector3 {
        return target.addVectors(
            this.position,
            _halfLengthDirection.copy(this.direction).multiplyScalar(this.length / 2)
        )
    }

    // Check if the line segment intersects a Box3, using the Slab Method
    // thanks chattyman
    // on hit, normal gets the axis aligned face the line entered through, point the entry point on that face
    // entry is tracked unclamped, so a segment starting inside the box (tunneled in on a long frame)
    // still resolves to the real entry face, with the point extrapolated back behind the start
    intersectsBox(box: Box3, normal?: Vector3, point?: Vector3): boolean {
        const start = this.getStartPoint(_start)
        const end = this.getEndPoint(_end)
        const direction = _direction.subVectors(end, start)
        const boxMin = box.min
        const boxMax = box.max
        let tMin = 0
        let tMax = 1
        let tEntry = -Infinity
        let axis = -1

        // x
        if (direction.x === 0) {
            if (start.x < boxMin.x || start.x > boxMax.x) return false
        } else {
            const inv = 1 / direction.x
            const t1 = (boxMin.x - start.x) * inv
            const t2 = (boxMax.x - start.x) * inv
            const tNear = t1 < t2 ? t1 : t2
            const tFar = t1 < t2 ? t2 : t1

            if (tNear > tEntry) {
                tEntry = tNear
                axis = 0
            }

            if (tNear > tMin) tMin = tNear
            if (tFar < tMax) tMax = tFar
            if (tMin > tMax) return false
        }

        // y
        if (direction.y === 0) {
            if (start.y < boxMin.y || start.y > boxMax.y) return false
        } else {
            const inv = 1 / direction.y
            const t1 = (boxMin.y - start.y) * inv
            const t2 = (boxMax.y - start.y) * inv
            const tNear = t1 < t2 ? t1 : t2
            const tFar = t1 < t2 ? t2 : t1

            if (tNear > tEntry) {
                tEntry = tNear
                axis = 1
            }

            if (tNear > tMin) tMin = tNear
            if (tFar < tMax) tMax = tFar
            if (tMin > tMax) return false
        }

        // z
        if (direction.z === 0) {
            if (start.z < boxMin.z || start.z > boxMax.z) return false
        } else {
            const inv = 1 / direction.z
            const t1 = (boxMin.z - start.z) * inv
            const t2 = (boxMax.z - start.z) * inv
            const tNear = t1 < t2 ? t1 : t2
            const tFar = t1 < t2 ? t2 : t1

            if (tNear > tEntry) {
                tEntry = tNear
                axis = 2
            }

            if (tNear > tMin) tMin = tNear
            if (tFar < tMax) tMax = tFar
            if (tMin > tMax) return false
        }

        // zero length segment, no direction to resolve a face from
        if (axis === -1) {
            normal?.set(0, 0, 0)
            point?.copy(start)

            return true
        }

        if (normal) {
            normal.set(0, 0, 0).setComponent(axis, direction.getComponent(axis) > 0 ? -1 : 1)
        }

        if (point) {
            point.copy(direction).multiplyScalar(tEntry).add(start)
        }

        return true
    }
}