import { spacebits, SpacebitsMaterial } from "@components/world/spacebits-material"
import LoopCounter from "@lib/helpers/loop-counter"
import { BufferGeometry, Group, Mesh } from "three"

type SpacebitsMesh = Mesh<BufferGeometry, SpacebitsMaterial>

const count = 10
const index = new LoopCounter(count)
const pool = Array.from({ length: count })
    .map(() => new SpacebitsMaterial())
// reused for single meshes, avoids an array per call
const _single: SpacebitsMesh[] = []

export function getNextSpacebitsMaterial() {
    return pool[index.next()]
}

// the meshes under a hit target, a group's direct children or the mesh itself
export function getSpacebitsMeshes(target: SpacebitsMesh | Group) {
    if (target instanceof Group) {
        return target.children as SpacebitsMesh[]
    }

    _single[0] = target

    return _single
}

// the pool material a target is flashing with, null when idle
export function getHitMaterial(meshes: SpacebitsMesh[]) {
    for (let i = 0; i < meshes.length; i++) {
        if (meshes[i].material !== spacebits) {
            return meshes[i].material
        }
    }

    return null
}

export function hitSpacebitsMaterial(target: SpacebitsMesh | Group | null) {
    if (!target) {
        return
    }

    let meshes = getSpacebitsMeshes(target)
    // one slot per target shared by all its meshes, kept if already flashing
    let material = getHitMaterial(meshes) ?? getNextSpacebitsMaterial()

    material.uHit.value = 1.25

    for (let i = 0; i < meshes.length; i++) {
        meshes[i].material = material
    }
}
