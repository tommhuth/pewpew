import { LinearFilter, ShaderMaterial, TextureLoader } from "three"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"
import { makeDepthUniforms } from "@components/effects/depth/depth-shader"
import dithering from "@shaders/dither.glsl"
import depth from "@components/effects/depth/depth.glsl"
import decalTextureUrl from "@assets/textures/decal.png"

const texture = new TextureLoader().load(decalTextureUrl)

texture.magFilter = LinearFilter
texture.minFilter = LinearFilter

const vertexShader = /* glsl */`
    attribute float aTime;

    varying float vTime;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.);

        vTime = aTime;
        vUv = uv;
        vWorldPosition = worldPosition.xyz;
        vPosition = position;

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`

const fragmentShader = /* glsl */`
    uniform sampler2D uMap;
    uniform sampler2D uDepthTexture;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform vec2 uResolution;

    varying float vTime;
    varying vec3 vWorldPosition;
    varying vec3 vPosition;
    varying vec2 vUv;

    ${dithering}
    ${depth}
    ${lightsChunk}

    void main() {
        float alpha = smoothstep(.25, 1., texture2D(uMap, vUv).a);

        float depth = getFragmentDepth(vWorldPosition, uDepthTexture, gl_FragCoord.xy / uResolution, viewMatrix, uCameraNear, uCameraFar);
        float intersection = 1. - clamp(abs(depth) / .5, 0., 1.);
        float dist = length(vUv - .5) * 2.;
        float radius = 1. - pow(1. - vTime, 2.);
        float grow =  step(dist, radius);
        int dither = ditherStep(gl_FragCoord.xy, alpha * intersection * grow,  2., .5);

        gl_FragColor = vec4(vec3(.5), 1.);

        applyLights(vWorldPosition);

        if (dither == 0) {
            discard;
        }
    }
`

function makeUniforms() {
    return {
        uMap: { value: texture },
        uLights: makeLightsUniform(),
        ...makeDepthUniforms(),
    }
}

export class DecalMaterial extends ShaderMaterial {
    declare uniforms: ReturnType<typeof makeUniforms>

    constructor() {
        super({
            uniforms: makeUniforms(),
            vertexShader,
            fragmentShader,
            depthWrite: false,
            depthTest: false,
        })
    }
}
