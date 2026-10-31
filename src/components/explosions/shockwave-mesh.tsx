import { Ref, useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { InstancedBufferAttribute, InstancedMesh, SphereGeometry, Vector2 } from "three"
import random from "@huth/random"
import { SHOCKWAVE_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@lib/depth"
import { useStore } from "@lib/store"
import { clamp, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import { easeOutCubic, easeOutQuart } from "@lib/helpers/shaping"
import LoopCounter from "@lib/helpers/loop-counter"
import { useShader } from "@src/hooks/use-shader"
import { Shockwave } from "@src/types/explosion"
import { Tuple3 } from "@src/types/global"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import depth from "@shaders/depth.glsl"

const geometry = new SphereGeometry(1, 10, 10)

geometry.setAttribute("aTime", new InstancedBufferAttribute(new Float32Array(SHOCKWAVE_COUNT), 1))

const shockwaveIndex = new LoopCounter(SHOCKWAVE_COUNT)

export function createShockwave(radius: number): Shockwave {
    return {
        lifetime: random.float(700, 800),
        radius,
        time: 0,
        index: shockwaveIndex.next(),
    }
}

// ring grows out from the explosion center
export function updateShockwave(instance: InstancedMesh, shockwave: Shockwave, position: Tuple3) {
    const t = clamp(shockwave.time / shockwave.lifetime)

    setBufferAttribute(instance.geometry, "aTime", t, shockwave.index)
    setMatrixAt({
        instance,
        index: shockwave.index,
        position: [position[0], position[1] + 1, position[2]],
        scale: easeOutCubic(t) * shockwave.radius,
    })
}

export default function ShockwaveMesh({ ref }: { ref: Ref<InstancedMesh> }) {
    const depthTexture = useStore(i => i.depthTexture)
    const camera = useThree(i => i.camera)
    const size = useThree(i => i.size)
    const viewport = useThree(i => i.viewport)
    const shader = useShader({
        uniforms: {
            uDepthTexture: { value: depthTexture },
            uCameraNear: { value: camera.near },
            uCameraFar: { value: camera.far },
            uResolution: { value: new Vector2() },
            // world units in front of the scene where the intersection fades out
            uIntersectionDistance: { value: .5 },
        },
        shared: /* glsl */`
            varying float vTime;
            varying vec3 vPosition;

            ${utils}
            ${noise}
 
        `,
        vertex: {
            head: /* glsl */`
                attribute float aTime;
            `,
            main: /* glsl */`
                vTime = aTime;
                vPosition = (instanceMatrix * vec4(position, 1.)).xyz;
            `
        },
        fragment: {
            head: /* glsl */`
                uniform sampler2D uDepthTexture;
                uniform float uCameraNear;
                uniform float uCameraFar;
                uniform vec2 uResolution;
                uniform float uIntersectionDistance;

                ${dithering}
                ${depth}
            `,
            main: /* glsl */`
                float sceneDistance = getFragmentDepth(
                    vPosition,
                    uDepthTexture,
                    gl_FragCoord.xy / uResolution,
                    viewMatrix,
                    uCameraNear,
                    uCameraFar
                );
                float intersection = 1. - clamp(sceneDistance / uIntersectionDistance, 0., 1.);
                float facing = smoothstep(0.4, 1., normal.z);

                gl_FragColor.rgb = mix(
                    vec3(1.),
                    vec3(1., .871, .584),
                    smoothstep(.5, 1., vTime)
                );

                float soft = .65;
                float noise2 = noise(vPosition * 1.2 + vTime * 1.);
                float thres = map(smoothstep(.0, .7, vTime), 0., 1., -soft, 1. + soft);
                float burtn = smoothstep(noise2 - soft, noise2 + soft, thres);

                float it = luma(dither(gl_FragCoord.xy, vec3(max(max(facing, intersection), burtn)), 2., 1.));

                if (it >.5) {
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
            args={[geometry, undefined, SHOCKWAVE_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
        >
            <meshLambertMaterial
                depthWrite={false}
                onBeforeCompile={shader.onBeforeCompile}
                customProgramCacheKey={shader.customProgramCacheKey}
            />
        </instancedMesh>
    )
}
