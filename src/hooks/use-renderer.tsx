import { useFBO } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { DepthTexture, MeshBasicMaterial, NearestFilter, UnsignedShortType } from "three"
import { setState } from "@lib/store"
import { DEPTH_IGNORE_LAYER } from "@lib/depth"

// depth only, the color target is never read
const depthMaterial = new MeshBasicMaterial({ colorWrite: false })

// renders custom depth texture, then final pass
export default function useRenderer() {
    const size = useThree(i => i.size)
    const viewport = useThree(i => i.viewport)
    // same resolution as the canvas so depth lines up with the pixel grid
    const width = Math.ceil(size.width * viewport.dpr)
    const height = Math.ceil(size.height * viewport.dpr)
    // made once, useFBO resizes it along with the target
    const depthTexture = useMemo(() => {
        const dt = new DepthTexture(width, height)

        dt.type = UnsignedShortType
        dt.minFilter = NearestFilter
        dt.magFilter = NearestFilter

        return dt
    }, [])
    const fbo = useFBO(width, height, {
        stencilBuffer: false,
        depthBuffer: true,
    })

    useEffect(() => {
        fbo.depthTexture = depthTexture
        setState({ depthTexture })

        return () => {
            depthTexture.dispose()
            setState({ depthTexture: null })
        }
    }, [fbo, depthTexture])

    useFrame(({ gl, scene, camera }) => {
        // render to depth buffer, excluding depth-ignored objects
        camera.layers.enableAll()
        camera.layers.disable(DEPTH_IGNORE_LAYER)
        scene.overrideMaterial = depthMaterial
        gl.setRenderTarget(fbo)
        gl.render(scene, camera)

        // normal pass
        scene.overrideMaterial = null
        camera.layers.enableAll()
        gl.setRenderTarget(null)
        gl.render(scene, camera)
    }, { phase: "render" })
}
