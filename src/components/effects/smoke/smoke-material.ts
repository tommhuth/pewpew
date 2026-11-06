import { ShaderMaterial } from "three"
import { makeDepthUniforms } from "@components/effects/depth/depth-shader"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import depth from "@components/effects/depth/depth.glsl"

const vertexShader = /* glsl */`
    attribute float aTime;
    attribute vec3 aColor;

    varying float vTime;
    varying vec3 vColor;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.);

        vTime = aTime;
        vColor = aColor;
        vWorldPosition = worldPosition.xyz;
        // view space, uniform instance scale so no per-axis correction needed
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`

const fragmentShader = /* glsl */`
    uniform float uTime;
    uniform sampler2D uDepthTexture;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform vec2 uResolution;

    varying float vTime;
    varying vec3 vColor;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    ${utils}
    ${noise}
    ${dithering}
    ${depth}

    void main() {
        vec3 normal = normalize(vNormal);
        float facing = smoothstep(.2, 1., normal.z);
        float n = smoothstep(.2, .6, noise(vWorldPosition * 1. + vec3(uTime, 0., uTime *.5)));
        float b = mix(n * facing, 1., pow(facing, 8.));

        float r = length(normal.xy);
        float soft = .4 * n + .2;
        float radius = map(smoothstep(.4, 1., vTime), 0., 1., -soft, 1. + soft);
        float circle =  smoothstep(radius - soft, radius + soft, r);

        float intr = getFragmentDepth(vWorldPosition, uDepthTexture, gl_FragCoord.xy / uResolution, viewMatrix, uCameraNear, uCameraFar);
        float l = b 
            * circle 
            * clamp(abs(intr / 1.), 0., 1.) 
            * map(noise(vWorldPosition * 1.3 + uTime), 0., 1., .5, 1.);
        int d = ditherStep(gl_FragCoord.xy, l, 2., .7);

        if (d == 0){
            discard;
        }
 

        gl_FragColor.rgb = mix(vec3(0.), vec3(1.), l); 
        // vColor is linear, back to srgb so the hex matches the spacebits swatches
        gl_FragColor.rgb = sRGBTransferOETF(vec4(vColor, 1.)).rgb;
        gl_FragColor.a = 1.;
    }
`

function makeUniforms() {
    return {
        uTime: { value: 0 },
        ...makeDepthUniforms(),
    }
}

export class SmokeMaterial extends ShaderMaterial {
    declare uniforms: ReturnType<typeof makeUniforms>
    toneMapped = false
    transparent = true
    wireframe = false

    constructor() {
        super({
            uniforms: makeUniforms(),
            vertexShader,
            fragmentShader,
        })
    }
}
