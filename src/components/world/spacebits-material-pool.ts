import { SpacebitsMaterial } from "@components/world/spacebits-material"
import LoopCounter from "@lib/helpers/loop-counter"

const count = 5
const index = new LoopCounter(count)
const pool = Array.from({ length: count })
    .map(() => new SpacebitsMaterial())

export function getNextSpacebitsMaterial() {
    return pool[index.next()]
}