import { Color, ShaderMaterial } from "three"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"

// dark to light, picked from the fireball palette
const palette = [
    new Color("#f18200"), // renders ~#e03900, no colorspace_fragment so the hex shows linearized
    new Color("#ffc800"),
    new Color("#fff"),
]

const vertexShader = /* glsl */`
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.);

        vWorldPosition = worldPosition.xyz;
        // view space
        vNormal = normalize(normalMatrix * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`

const fragmentShader = /* glsl */`
    #define PALETTE_SIZE ${palette.length}

    uniform vec3 uPalette[PALETTE_SIZE];
    uniform float uTime;
    uniform float uDither;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    ${utils}
    ${noise}
    ${dithering}

    void main() {
        vec3 normal = normalize(vNormal);
        float facing = clamp(normal.z, 0., 1.); 
        float n = noise(vWorldPosition *.5 + uTime * 5.);
        int edge = ditherStep(gl_FragCoord.xy, smoothstep(.1, .8, facing - n * .65), 2., .5);

        if (edge == 0){
            discard;
        }

        float flicker = noise(vWorldPosition * .5 + vec3(0., uTime * 8., 0.)) * .2 - .1;
        float shade = smoothstep(.7, .9, facing - n * .2 + flicker);

        gl_FragColor.a = 1.;
        gl_FragColor.rgb = uPalette[ditherStep(gl_FragCoord.xy, shade, float(PALETTE_SIZE), uDither)];
    }
`

function makeUniforms() {
    return {
        uPalette: { value: palette },
        uTime: { value: 0 },
        uDither: { value: .8 },
    }
}

export class ExhaustMaterial extends ShaderMaterial {
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

export const exhaustMaterial = new ExhaustMaterial()