import { Color, ShaderMaterial, Vector2 } from "three"
import { makeDepthUniforms } from "@components/effects/depth/depth-shader"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import depth from "@components/effects/depth/depth.glsl"

// dark to light 
const palette = [
    new Color("#db4900"),
    new Color("#ff9500"),
    new Color("#ffc800"),
    new Color("#ffff66"),
    new Color("#fff")
]

const vertexShader = /* glsl */`
    attribute float aTime;

    varying float vTime;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.);

        vTime = aTime;
        vWorldPosition = worldPosition.xyz;
        // view space, uniform instance scale so no per-axis correction needed
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`

const fragmentShader = /* glsl */`
    #define PALETTE_SIZE ${palette.length}

    uniform vec3 uPalette[PALETTE_SIZE];
    uniform vec2 uLumaRange;
    uniform float uDither;
    uniform sampler2D uDepthTexture;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform vec2 uResolution;
    uniform float uIntersectionDistance;

    varying float vTime;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    ${utils}
    ${noise}
    ${dithering}
    ${depth}

    void main() {
        vec3 normal = normalize(vNormal);
        float facing = clamp(normal.z, 0., 1.);
        float sceneDistance = getFragmentDepth(vWorldPosition, uDepthTexture, gl_FragCoord.xy / uResolution, viewMatrix, uCameraNear, uCameraFar);
        float intersection = 1. - clamp(sceneDistance / uIntersectionDistance, 0., 1.);
        float noise1 = smoothstep(.3, .8, noise(vWorldPosition * 1.5 + vTime * 8.));

        gl_FragColor = vec4(
            vec3(facing)
                * (1. - vTime)
                * mix(1., noise1, smoothstep(.15, .3, vTime)), 
            1.
        );

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
    }
`

function makeUniforms() {
    return {
        uPalette: { value: palette },
        // luma stretched from this range to the full palette
        uLumaRange: { value: new Vector2(0, 1) },
        uDither: { value: 1 },
        ...makeDepthUniforms(),
        // world units in front of the scene where the intersection fades out
        uIntersectionDistance: { value: 2 },
    }
}

export class FireballMaterial extends ShaderMaterial {
    declare uniforms: ReturnType<typeof makeUniforms>
    toneMapped = false

    constructor() {
        super({
            uniforms: makeUniforms(),
            vertexShader,
            fragmentShader,
        })
    }
}
