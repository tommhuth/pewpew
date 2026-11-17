import { useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect } from "react"
import { CAMERA_DIRECTION } from "@lib/const"
import Lights from "@components/lights"
import TerrainEditor from "./terrain/terrain-editor"
import { paintCell, rotateCell, moveCamera, useEditorStore, createPlacement } from "./store"
import { EditorMode } from "./editor-types"
import ModelPlacer from "./model-placer/model-placer"

function EditorCamera() {
    const camera = useThree(i => i.camera)
    const cameraPosition = useEditorStore(i => i.cameraPosition)

    useLayoutEffect(() => {
        camera.position.copy(CAMERA_DIRECTION)
        camera.lookAt(0, 0, 0)
        camera.position.set(...cameraPosition)
    }, [camera, cameraPosition])

    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            // wheel pans along z
            moveCamera([0, 0, e.deltaY * .02])
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

                        const { mode } = useEditorStore.getState()

                        if (mode === EditorMode.PLACEMENT) {
                            createPlacement(e.point.toArray())
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
