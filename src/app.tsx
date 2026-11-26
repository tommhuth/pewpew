import { extend } from "@react-three/fiber"
import { lazy, Suspense, useEffect } from "react"
import config from "@lib/config"
import { setState, State, useStore } from "@lib/store"
import useFramerateReady from "@src/hooks/use-framerate-ready"
import useRenderer from "@src/hooks/use-renderer"
import extensions from "./extensions"
import Camera from "@components/camera"
import Lights from "@components/lights"
import Player from "@components/player"
import World from "@components/world/world"
import Bullets from "@components/bullets"
import Explosions from "@components/effects/explosions"
import { plantMaterial } from "@components/entities/plant/plant-material"
import { glassMaterial } from "@components/entities/glass-material"
import { boxGeometry } from "@lib/const"
import { exhaustMaterial } from "@components/entities/rocket/exhaust-material"

extend(extensions)

const Perf = lazy(() => import("r3f-perf").then(({ Perf }) => ({ default: Perf })))

const revealTimeout = 2_500

export default function App() {
    const loading = useStore(i => i.loading)

    useRenderer()
    useFramerateReady(() => setState({ loading: false }))

    useEffect(() => {
        if (loading) {
            return
        }

        const canvas = document.getElementById("canvas")
        const label = document.getElementById("loading")

        canvas?.style.setProperty("clip-path", "inset(0)")

        const drop = () => label?.remove()
        const ready = () => {
            drop()
            setState({ state: State.READY })
        }
        const tid = setTimeout(ready, revealTimeout)

        canvas?.addEventListener("transitionstart", drop, { once: true })
        canvas?.addEventListener("transitionend", ready, { once: true })

        return () => {
            clearTimeout(tid)
            canvas?.removeEventListener("transitionstart", drop)
            canvas?.removeEventListener("transitionend", ready)
        }
    }, [loading])

    return (
        <>
            {loading && [plantMaterial, exhaustMaterial, glassMaterial].map(material => {
                return (
                    <mesh
                        key={material.uuid}
                        material={material}
                        castShadow
                        receiveShadow
                        frustumCulled={false}
                        geometry={boxGeometry}
                        position={[0, -1, 0]}
                    />
                )
            })}

            <color attach={"background"} args={["#fff"]} />

            <Camera />
            <Lights />

            <World />
            <Player />
            <Bullets />
            <Explosions />

            {config.stats && (
                <Suspense fallback={null}>
                    <Perf position="top-right" deepAnalyze />
                </Suspense>
            )}
        </>
    )
}  