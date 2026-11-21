import type { SpacebitsMaterial } from "@components/world/spacebits-material"
import LoopCounter from "@lib/helpers/loop-counter"
import { Group, Mesh } from "three"

export interface MaterialPool<T extends SpacebitsMaterial = SpacebitsMaterial> {
    // what the meshes wear when not flashing
    base: T
    // flash materials, one per hit target so each fades on its own uHit
    materials: T[]
    index: LoopCounter
}

export function createMaterialPool<T extends SpacebitsMaterial>(
    base: T,
    create: () => T,
    count = 10
): MaterialPool<T> {
    return {
        base,
        materials: Array.from({ length: count }, () => create()),
        index: new LoopCounter(count),
    }
}

// reused for single meshes, avoids an array per call
const _single: Mesh[] = []

// the meshes under a hit target, a group's direct children or the mesh itself
export function getMeshes(target: Mesh | Group) {
    if (target instanceof Group) {
        return target.children as Mesh[]
    }

    _single[0] = target

    return _single
}

// the pool material a target is flashing with, null when idle
export function getHitMaterial<T extends SpacebitsMaterial>(meshes: Mesh[], pool: MaterialPool<T>) {
    for (let i = 0; i < meshes.length; i++) {
        let material = meshes[i].material as T

        if (pool.materials.includes(material)) {
            return material
        }
    }

    return null
}

export function hitMaterial<T extends SpacebitsMaterial>(target: Mesh | Group | null, pool: MaterialPool<T>) {
    if (!target) {
        return
    }

    let meshes = getMeshes(target)
    // one slot per target shared by all its meshes, kept if already flashing
    let material = getHitMaterial(meshes, pool) ?? pool.materials[pool.index.next()]

    material.uHit.value = 1.25

    for (let i = 0; i < meshes.length; i++) {
        meshes[i].material = material
    }
}
