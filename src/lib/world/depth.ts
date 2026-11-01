import { Layers } from "three"

// objects on this layer are left out of the depth pass, eg soft particles sampling it
export const DEPTH_IGNORE_LAYER = 1
export const depthIgnoreLayers = new Layers()

depthIgnoreLayers.set(DEPTH_IGNORE_LAYER)
