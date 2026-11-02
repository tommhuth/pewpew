import type { ThreeElement } from "@react-three/fiber"
import {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, LightProbe, HemisphereLight,
} from "three"
import { SpacebitsMaterial } from "@components/world/spacebits-material"
import { FireballMaterial } from "@components/effects/fireball/fireball-material"
import { ShockwaveMaterial } from "@components/effects/shockwave/shockwave-material"
import { DecalMaterial } from "@components/effects/decal/decal-material"

export default {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, LightProbe, HemisphereLight,
    SpacebitsMaterial, FireballMaterial, ShockwaveMaterial, DecalMaterial,
}

declare module "@react-three/fiber" {
    interface ThreeElements {
        spacebitsMaterial: ThreeElement<typeof SpacebitsMaterial>
        fireballMaterial: ThreeElement<typeof FireballMaterial>
        shockwaveMaterial: ThreeElement<typeof ShockwaveMaterial>
        decalMaterial: ThreeElement<typeof DecalMaterial>
    }
}
