import type { ThreeElement } from "@react-three/fiber"
import {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, LightProbe, HemisphereLight,
} from "three"
import { SpacebitsMaterial } from "@components/world/spacebits-material"
import { FireballMaterial } from "@components/effects/fireball/fireball-material"
import { ShockwaveMaterial } from "@components/effects/shockwave/shockwave-material"
import { DecalMaterial } from "@components/effects/decal/decal-material"
import { SmokeMaterial } from "@components/effects/smoke/smoke-material"
import { ParticleMaterial } from "@components/effects/particle/particle-material"
import { LeafMaterial } from "@components/effects/leaf/leaf-material"

export default {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, LightProbe, HemisphereLight,
    SpacebitsMaterial, FireballMaterial, ShockwaveMaterial, DecalMaterial, SmokeMaterial,
    ParticleMaterial, LeafMaterial,
}

declare module "@react-three/fiber" {
    interface ThreeElements {
        spacebitsMaterial: ThreeElement<typeof SpacebitsMaterial>
        fireballMaterial: ThreeElement<typeof FireballMaterial>
        shockwaveMaterial: ThreeElement<typeof ShockwaveMaterial>
        decalMaterial: ThreeElement<typeof DecalMaterial>
        smokeMaterial: ThreeElement<typeof SmokeMaterial>
        particleMaterial: ThreeElement<typeof ParticleMaterial>
        leafMaterial: ThreeElement<typeof LeafMaterial>
    }
}
