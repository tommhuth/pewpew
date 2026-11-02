import { DepthTexture, Vector2 } from "three"

export interface DepthUniforms {
    uDepthTexture: { value: DepthTexture | null }
    uCameraNear: { value: number }
    uCameraFar: { value: number }
    uResolution: { value: Vector2 }
}

// values are filled in by useDepth
export function makeDepthUniforms(): DepthUniforms {
    return {
        uDepthTexture: { value: null },
        uCameraNear: { value: 0 },
        uCameraFar: { value: 0 },
        uResolution: { value: new Vector2() },
    }
}
