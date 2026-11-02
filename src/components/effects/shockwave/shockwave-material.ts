import { ShaderMaterial } from "three"
import { makeDepthUniforms } from "@components/effects/depth/depth-shader"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import depth from "@components/effects/depth/depth.glsl"

const vertexShader = /* glsl */`
    attribute float aTime;

    varying float vTime;
    varying vec3 vPosition;
    varying vec3 vNormal;

    void main() {
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.);

        vTime = aTime;
        vPosition = worldPosition.xyz;
        // view space, uniform instance scale so no per-axis correction needed
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`

const fragmentShader = /* glsl */`
    uniform sampler2D uDepthTexture;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform vec2 uResolution;
    uniform float uIntersectionDistance;

    varying float vTime;
    varying vec3 vPosition;
    varying vec3 vNormal;

    ${utils}
    ${noise}
    ${dithering}
    ${depth}

    void main() {
        vec3 normal = normalize(vNormal);
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

        gl_FragColor = vec4(
            mix(
                vec3(1.),
                vec3(1., .871, .584),
                smoothstep(.5, 1., vTime)
            ), 
            1.
        );

        float soft = .65;
        float noise2 = noise(vPosition * 1.2 + vTime * 1.);
        float thres = map(smoothstep(.0, .7, vTime), 0., 1., -soft, 1. + soft);
        float burtn = smoothstep(noise2 - soft, noise2 + soft, thres);

        float it = luma(dither(gl_FragCoord.xy, vec3(max(max(facing, intersection), burtn)), 2., 1.));

        if (it >.5) {
            discard;
        }
    }
`

function makeUniforms() {
    return {
        ...makeDepthUniforms(),
        // world units in front of the scene where the intersection fades out
        uIntersectionDistance: { value: .5 },
    }
}

export class ShockwaveMaterial extends ShaderMaterial {
    declare uniforms: ReturnType<typeof makeUniforms>
    toneMapped = false

    constructor() {
        super({
            uniforms: makeUniforms(),
            vertexShader,
            fragmentShader,
            depthWrite: false,
        })
    }
}
