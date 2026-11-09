import { useFrame, useThree } from "@react-three/fiber"
import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { DirectionalLight } from "three"
import { useStore } from "@lib/store"
import { CAMERA_OFFSET } from "@lib/const"

// seconds between moving the shadow camera along with the player
const updateInterval = 1
const iz = -.1

export default function Lights() {
    const shadowLight = useRef<DirectionalLight>(null)
    const time = useRef(0)
    const scene = useThree(i => i.scene)
    const viewport = useThree(i => i.viewport)
    const diagonal = Math.hypot(viewport.width, viewport.height)
    const playerObject = useStore(i => i.player.object)
    const updateShadowCamera = useCallback(() => {
        const { player } = useStore.getState()

        if (!shadowLight.current || !player.object) {
            return
        }

        const z = player.object.position.z + CAMERA_OFFSET.z

        shadowLight.current.position.z = z + iz
        shadowLight.current.target.position.z = z
    }, [])

    // target has to be in the scene for its world matrix to update
    useEffect(() => {
        const light = shadowLight.current

        if (!light) {
            return
        }

        scene.add(light.target)

        return () => {
            scene.remove(light.target)
        }
    }, [scene])

    useLayoutEffect(() => {
        updateShadowCamera()
    }, [playerObject, updateShadowCamera])

    // frustum depth follows the viewport
    useLayoutEffect(() => {
        shadowLight.current?.shadow.camera.updateProjectionMatrix()
    }, [diagonal])

    useFrame((_, delta) => {
        time.current += delta

        if (time.current >= updateInterval) {
            updateShadowCamera()
            time.current = 0
        }
    })

    return (
        <>
            <hemisphereLight
                groundColor={"#fff"}
                color={"#fff"}
                intensity={1.5}
            />
            <directionalLight
                ref={shadowLight}
                color="#fff"
                position={[-.35, .2, iz]}
                intensity={14}
                castShadow
                shadow-camera-near={-15} // y
                shadow-camera-far={20}
                shadow-camera-left={-diagonal} // x
                shadow-camera-right={diagonal}
                shadow-camera-top={10} // z
                shadow-camera-bottom={-10}
                shadow-mapSize={[512, 512]}
                shadow-bias={-.001}
                shadow-radius={2}
            />
        </>
    )
}
