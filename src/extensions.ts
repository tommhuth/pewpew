import type { ThreeElement } from "@react-three/fiber"
import {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, LightProbe, HemisphereLight,
} from "three"
import { SpacebitsMaterial } from "@lib/materials"

export default {
    Group, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial,
    Mesh, BoxGeometry, AmbientLight, DirectionalLight, LightProbe, HemisphereLight,
    SpacebitsMaterial,
}

declare module "@react-three/fiber" {
    interface ThreeElements {
        spacebitsMaterial: ThreeElement<typeof SpacebitsMaterial>
    }
}
