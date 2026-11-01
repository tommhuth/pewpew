import { extend, useFrame } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { useEffect } from "react"
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

extend(extensions)

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

    useFrame(() => {
        let x = useStore.getState().world.grid

    })

    return (
        <>

            <color attach={"background"} args={["#fff"]} />
            <Camera />
            <Lights />

            <axesHelper scale={5} position={[0, .01, 0]} />

            <World />
            <Player />
            <Bullets />
            <Explosions />

            {config.stats && <Perf position="top-right" deepAnalyze />}
        </>
    )
}

<fog attach={"fog"} args={["#fff", 40, 90]} />