import { Ref, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { Color, InstancedMesh, Vector2 } from "three"
import random from "@huth/random"
import { FIREBALL_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@lib/world/depth"
import { useStore } from "@lib/store"
import { clamp, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import { blend, easeOutQuart } from "@lib/helpers/shaping"
import LoopCounter from "@lib/helpers/loop-counter"
import { useShader } from "@src/hooks/use-shader"
import { Fireball } from "@src/types/explosion"
import { Tuple2, Tuple3 } from "@src/types/global"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import depth from "@shaders/depth.glsl"

const times = new Float32Array(FIREBALL_COUNT)
// dark to light, raw srgb values since the pick happens after the colorspace conversion
const palette = [
    "#ff6a00",
    "#ff9500",
    "#ffc800",
    "#ffff66",
    "#fff"
].map(i => new Color(i).convertLinearToSRGB())

const fireballIndex = new LoopCounter(FIREBALL_COUNT)

interface CreateFireballsParams {
    position: Tuple3
    count: number
    radius: Tuple2 // start radius, spread from first to last fireball
    growth: Tuple2 // max radius as a multiple of the start radius
    spread: [xz: number, y: number] // offset from position, xz either side, y upwards
    lifetime: Tuple2
}

export function createFireballs({
    position,
    count,
    radius,
    growth,
    spread,
    lifetime,
}: CreateFireballsParams) {
    return Array.from({ length: count }, (_, i): Fireball => {
        const startRadius = (i / count) * (radius[1] - radius[0]) + radius[0]

        return {
            index: fireballIndex.next(),
            position: [
                random.pick(-spread[0], spread[0]) + position[0],
                random.float(0, spread[1]) + position[1],
                random.pick(-spread[0], spread[0]) + position[2],
            ],
            startRadius,
            maxRadius: startRadius * random.float(...growth),
            time: random.integer(-200, 0),
            lifetime: random.integer(...lifetime),
        }
    })
}

// reused each frame per fireball
const _fireballPosition: Tuple3 = [0, 0, 0]
const _fireballBlend: Tuple3 = [0, 0, 0]

// swells up then shrinks away while drifting up
export function updateFireball(instance: InstancedMesh, fireball: Fireball) {
    const t = clamp(fireball.time / fireball.lifetime)

    _fireballBlend[0] = fireball.startRadius
    _fireballBlend[1] = fireball.maxRadius
    _fireballPosition[0] = fireball.position[0]
    _fireballPosition[1] = fireball.position[1] + t * (fireball.index % 3)
    _fireballPosition[2] = fireball.position[2]

    setBufferAttribute(instance.geometry, "aTime", t, fireball.index)
    setMatrixAt({
        instance,
        index: fireball.index,
        position: _fireballPosition,
        scale: fireball.time < 0 ? 0 : blend(_fireballBlend, easeOutQuart(t)),
    })
}

export default function FireballMesh({ ref }: { ref: Ref<InstancedMesh> }) {
    const depthTexture = useStore(i => i.depthTexture)
    const camera = useThree(i => i.camera)
    const size = useThree(i => i.size)
    const viewport = useThree(i => i.viewport)
    const shader = useShader({
        shared: /* glsl */`
            varying float vTime;

                varying vec3 vWorldPosition;

            ${utils}
            ${noise}
        `,
        uniforms: {
            uPalette: { value: palette },
            // luma stretched from this range to the full palette
            uLumaRange: { value: new Vector2(0, 1) },
            uDither: { value: 1 },
            uDepthTexture: { value: depthTexture },
            uCameraNear: { value: camera.near },
            uCameraFar: { value: camera.far },
            uResolution: { value: new Vector2() },
            // world units in front of the scene where the intersection fades out
            uIntersectionDistance: { value: 2 },
        },
        vertex: {
            head: /* glsl */`
                attribute float aTime;
            `,
            main: /* glsl */`
                vTime = aTime;
                vWorldPosition = (instanceMatrix * vec4(position, 1.)).xyz;

            `
        },
        fragment: {
            head: /* glsl */`
                #define PALETTE_SIZE ${palette.length}
                uniform vec3 uPalette[PALETTE_SIZE];
                uniform vec2 uLumaRange;
                uniform float uDither;
                uniform sampler2D uDepthTexture;
                uniform float uCameraNear;
                uniform float uCameraFar;
                uniform vec2 uResolution;
                uniform float uIntersectionDistance;

                ${dithering}
                ${depth}
            `,
            main: /* glsl */`
                float facing = clamp(normal.z, 0., 1.);
                float sceneDistance = getFragmentDepth(vWorldPosition, uDepthTexture, gl_FragCoord.xy / uResolution, viewMatrix, uCameraNear, uCameraFar);
                float intersection = 1. - clamp(sceneDistance / uIntersectionDistance, 0., 1.);
                float noise1 = smoothstep(.3, .8, noise(vWorldPosition * 1.5 + vTime * 8.));

                gl_FragColor.rgb = vec3(facing)
                    * (1. - vTime)
                    * mix(1., noise1, smoothstep(.15, .3, vTime));

                float brightness = luma(gl_FragColor.rgb);
                float shade = map(brightness, uLumaRange.x, uLumaRange.y, 0., 1.);

                gl_FragColor.rgb = uPalette[ditherStep(gl_FragCoord.xy, shade, float(PALETTE_SIZE), uDither)];


                float noise2 = smoothstep(.3, .8, noise(vWorldPosition * 1.5 + vTime * 2.));
                float thres = map(smoothstep(.15, .7, vTime), 0., 1., -.1, 1.1);
                float burtn = smoothstep(noise2 - .1, noise2 + .1, thres);

                vec3 a2 = vec3(max(intersection, burtn));
                float a = luma(dither(gl_FragCoord.xy, a2, 2., .4));

                if (a > .5){
                    discard;
                }
            `
        }
    })

    useEffect(() => {
        shader.uniforms.uDepthTexture.value = depthTexture
        shader.uniforms.uResolution.value.set(size.width, size.height).multiplyScalar(viewport.dpr)
    }, [shader.uniforms, depthTexture, size, viewport.dpr])

    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, FIREBALL_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
        >
            <sphereGeometry args={[1, 8, 8]}>
                <instancedBufferAttribute attach="attributes-aTime" args={[times, 1]} />
            </sphereGeometry>
            <meshLambertMaterial
                color="#fff"
                onBeforeCompile={shader.onBeforeCompile}
                customProgramCacheKey={shader.customProgramCacheKey}
            />
        </instancedMesh>
    )
}
