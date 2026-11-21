import { DoubleSide } from "three"
import { SpacebitsMaterial } from "@components/world/spacebits-material"
import { createMaterialPool } from "@components/world/material-pool"

export class PlantMaterial extends SpacebitsMaterial {
    side = DoubleSide
}

export const plant = new PlantMaterial()
export const plantPool = createMaterialPool(plant, () => new PlantMaterial(), 2)
