import { useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect } from "react"
import { CAMERA_DIRECTION, CAMERA_OFFSET } from "@lib/const"
import Lights from "@components/lights"
import TerrainEditor from "./terrain/terrain-editor"
import { EditorMode, paintCell, rotateCell, setCameraZ, useEditorStore } from "./store"
import ModelPlacer, { placeAt } from "./model-placer"

function EditorCamera() {
    const camera = useThree(i => i.camera)
    const cameraZ = useEditorStore(i => i.cameraZ)

    useLayoutEffect(() => {
        camera.position.copy(CAMERA_DIRECTION)
        camera.lookAt(0, 0, 0)
        camera.position.x = CAMERA_DIRECTION.x + CAMERA_OFFSET.x - 3
        camera.position.z = CAMERA_DIRECTION.z + CAMERA_OFFSET.z + cameraZ
    }, [camera, cameraZ])

    // wheel pans along z
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            setCameraZ(useEditorStore.getState().cameraZ + e.deltaY * .02)
        }

        window.addEventListener("wheel", onWheel)

        return () => window.removeEventListener("wheel", onWheel)
    }, [])

    return null
}

export default function Editor() {
    const terrain = useEditorStore(i => i.map ? i.maps[i.map]?.terrain : null)

    return (
        <>
            <EditorCamera />
            <Lights />

            <axesHelper scale={5} position={[0, .01, 0]} />
            <ModelPlacer />

            {terrain && (
                <TerrainEditor
                    terrain={terrain}
                    onCellClick={(x, z, e) => {
                        e.stopPropagation()

                        if (useEditorStore.getState().mode === EditorMode.PLACEMENT) {
                            placeAt(e.point.toArray())
                        } else if (e.shiftKey) {
                            rotateCell(x, z)
                        } else {
                            paintCell(x, z)
                        }
                    }}
                />
            )}
        </>
    )
}
