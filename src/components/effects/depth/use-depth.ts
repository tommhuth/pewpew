import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { useStore } from "@lib/store"
import { DepthUniforms } from "./depth-shader"

// keeps the depth uniforms in sync with the depth pass, camera and canvas size
// undefined until the material is mounted
export function useDepth(uniforms: DepthUniforms | undefined) {
    const depthTexture = useStore(i => i.depthTexture)
    const camera = useThree(i => i.camera)
    const size = useThree(i => i.size)
    const viewport = useThree(i => i.viewport)

    useEffect(() => {
        if (!uniforms) {
            return
        }

        uniforms.uDepthTexture.value = depthTexture
        uniforms.uCameraNear.value = camera.near
        uniforms.uCameraFar.value = camera.far
        uniforms.uResolution.value.set(size.width, size.height).multiplyScalar(viewport.dpr)
    }, [uniforms, depthTexture, camera, size, viewport.dpr])
}
