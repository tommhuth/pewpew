import { DoubleSide } from "three"
import { SpacebitsMaterial } from "@components/entities/spacebits-material"
import { createMaterialPool } from "@components/entities/material-pool"

export class PlantMaterial extends SpacebitsMaterial {
    side = DoubleSide
}

export const plantMaterial = new PlantMaterial()
export const plantMaterialPool = createMaterialPool(plantMaterial, () => new PlantMaterial(), 2)
