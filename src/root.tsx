import { createRoot as createUiRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"
import { lazy, Suspense, type JSX } from "react"
import { createRoot, RenderProps, events } from "@react-three/fiber"
import { AgXToneMapping } from "three"
import Ui from "./ui/ui"
import { getCanvasSize, getDpr, getPixelSize, getZoom } from "@lib/viewport"

function getConfiguration() {
    const [width, height] = getCanvasSize()

    return {
        camera: {
            zoom: getZoom(),
            near: -15,
            far: 150,
            position: [0, 0, 0],
        },
        events,
        orthographic: true,
        shadows: true,
        dpr: getDpr(), // clamp(Math.pow(window.devicePixelRatio, 0.55), 1, 2),
        size: {
            width,
            height,
            top: 0,
            left: 0
        },
        gl: {
            toneMapping: AgXToneMapping,
            antialias: false,
            depth: true,
            stencil: false,
            alpha: false,
            powerPreference: "high-performance",
            //localClippingEnabled: true,
        },
    } satisfies RenderProps<HTMLCanvasElement>
}

async function configure(element?: JSX.Element) {
    const configuration = getConfiguration()

    // r3f calls setSize(w, h, false) so the css size is ours to set; keep it at
    // the rounded size so the pixel upscale stays an integer
    canvas.style.width = configuration.size.width + "px"
    canvas.style.height = configuration.size.height + "px"
    // pull the overscan offscreen
    canvas.style.left = -getPixelSize() + "px"
    canvas.style.top = -getPixelSize() + "px"

    await canvasRoot.configure(configuration)

    if (element) {
        canvasRoot.render(element)
    }
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const canvasRoot = createRoot(canvas)
const uiRoot = createUiRoot(document.getElementById("ui") as HTMLDivElement)
const isEditorMode = window.location.hash.includes("editor")

if (isEditorMode) {
    const Editor = lazy(() => import("./editor/editor"))
    const EditorUi = lazy(() => import("./editor/editor-ui"))

    document.title = "pewpew editor"
    // skip the game's reveal
    canvas.style.setProperty("clip-path", "inset(0)")
    document.getElementById("loading")?.remove()

    configure(<Editor />)
    uiRoot.render(<Suspense><EditorUi /></Suspense>)
} else {
    const App = lazy(() => import("./app"))

    configure(<App />)
    uiRoot.render(<Ui />)
}

window.addEventListener("resize", () => configure())
screen.orientation?.addEventListener("change", () => configure())

let updateSW = registerSW({
    onNeedRefresh() {
        console.info("New services worker ready")
        updateSW(true)
    },
    onOfflineReady() {
        console.info("Ready to work offline")
    },
})
