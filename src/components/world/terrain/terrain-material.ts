import { Color, MeshPhongMaterial, Vector2, Vector3, WebGLProgramParametersWithUniforms } from "three"
import { MAP_CELL_SIZE, MAP_WIDTH } from "@lib/world/terrain"
import { syncLights } from "@components/effects/lights/lights"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import utils from "@shaders/utils.glsl"
import easings from "@shaders/easings.glsl"
import { Tuple3 } from "@src/types/global"
import LoopCounter from "@lib/helpers/loop-counter"
import { damp } from "three/src/math/MathUtils.js"
import { ndelta } from "@lib/helpers/utils"
import random from "@huth/random"

const palette = [
    "#5e6a82",
    "#ccd0d9",
    "#f1f2f6",
    "#fbfbfd",
].map(i => new Color(i).convertLinearToSRGB())

interface ExplosionShockwaveUniform {
    value: {
        position: Vector3
        radius: number
        targetRadius: number
        time: number
        lifetime: number
        opacity: number
    }[]
}

const shockwaveCount = 15
const shockwaveIndex = new LoopCounter(shockwaveCount)

export function createTerrainShockwave(position: Tuple3, radius: number) {
    let wave = shockwavesUniform.value[shockwaveIndex.next()]
    let time = random.integer(400, 600)

    wave.position.set(...position)
    wave.radius = radius * .25
    wave.targetRadius = radius
    wave.time = time
    wave.lifetime = time
}

const shockwavesUniform: ExplosionShockwaveUniform = {
    value: Array.from({ length: shockwaveCount }).map(() => ({
        radius: 0,
        targetRadius: 0,
        time: 0,
        lifetime: 1,
        opacity: 0,
        position: new Vector3()
    }))
}
const lightsUniform = makeLightsUniform()

let lastTime = performance.now()

function tick(time: number) {
    const delta = ndelta((time - lastTime) / 1000)

    lastTime = time

    for (let i = 0; i < shockwavesUniform.value.length; i++) {
        let wave = shockwavesUniform.value[i]

        wave.radius = damp(wave.radius, wave.targetRadius, 4, delta)
        wave.time = Math.max(wave.time - delta * 1000, 0)
        wave.opacity = wave.time / wave.lifetime
    }

    syncLights(lightsUniform)

    requestAnimationFrame(tick)
}

requestAnimationFrame(tick)

export class TerrainMaterial extends MeshPhongMaterial {
    constructor() {
        super({
            shininess: 6,
            specular: "#666",
            toneMapped: false,
            color: "#212629",
        })
    }

    customProgramCacheKey() {
        return "terrain"
    }

    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
        shader.uniforms.uCellSize = { value: MAP_CELL_SIZE }
        // cell edges on x sit at (ix - w / 2) * cellsize
        shader.uniforms.uGridOffset = {
            value: new Vector2((MAP_WIDTH / 2 * MAP_CELL_SIZE) % MAP_CELL_SIZE, 0)
        }
        shader.uniforms.uPalette = { value: palette }
        // luma stretched from this range to the full palette
        shader.uniforms.uLumaRange = { value: new Vector2(0, .4) }
        shader.uniforms.uDither = { value: 1 }
        shader.uniforms.uLineWidth = { value: 1.5 }
        shader.uniforms.uExplosionShockwaves = shockwavesUniform
        shader.uniforms.uLights = lightsUniform

        const shared = /* glsl */`
            varying vec3 vGridPosition;
            varying vec3 vGridNormal;

            struct ExplosionShockwave {
                vec3 position;
                float radius;
                float opacity;
            };

            uniform ExplosionShockwave uExplosionShockwaves[${shockwaveCount}];
        `

        shader.vertexShader = shader.vertexShader
            .replace("#include <common>", /* glsl */`
                #include <common>
                ${shared}
            `)
            .replace("#include <begin_vertex>", /* glsl */`
                #include <begin_vertex>

                #ifdef USE_INSTANCING
                    mat4 gridMatrix = modelMatrix * instanceMatrix;
                #else
                    mat4 gridMatrix = modelMatrix;
                #endif

                vGridPosition = (gridMatrix * vec4(transformed, 1.)).xyz;
                vGridNormal = normalize(mat3(gridMatrix) * objectNormal);
            `)

        shader.fragmentShader = shader.fragmentShader
            .replace("#include <common>", /* glsl */`
                #include <common>
                ${shared}

                uniform float uCellSize;
                uniform vec2 uGridOffset;
                #define PALETTE_SIZE ${palette.length}
                uniform vec3 uPalette[PALETTE_SIZE];
                uniform vec2 uLumaRange;
                uniform float uDither;
                uniform float uLineWidth;

                ${dithering}
                ${noise}
                ${utils}
                ${easings}
                ${lightsChunk}
            `)
            .replace("#include <dithering_fragment>", /* glsl */`
                #include <dithering_fragment>

                vec2 cell = (vGridPosition.xz - uGridOffset) / uCellSize;
                // pixels to the nearest cell edge
                vec2 dist = abs(fract(cell - .5) - .5) / max(fwidth(cell), vec2(.0001));
                // walls facing an axis would be all line on that axis, so mask it out
                vec2 mask = step(abs(vGridNormal.xz), vec2(.5));
                // half the width on each side of the edge
                float line = step(min(dist.x + (1. - mask.x) * 1e3, dist.y + (1. - mask.y) * 1e3), uLineWidth * .5);

                gl_FragColor.rgb = mix(
                    gl_FragColor.rgb,
                    gl_FragColor.rgb * .45,
                    smoothstep(.3, 1., map((noise(vGridPosition.xz * .1) * 2. - 1.) * dot(vec3(0., 1., 0.), vGridNormal), -1., 1., 0., 1.))
                        * (1. - clamp(abs(vGridPosition.x) / 6., 0., 1.))
                );
                gl_FragColor.rgb *= 1. - line * .1;
                gl_FragColor.rgb = mix(
                    gl_FragColor.rgb ,
                    vec3(0.),
                    smoothstep(0., -6., vGridPosition.y)
                );

                float shade = map(luma(gl_FragColor.rgb), uLumaRange.x, uLumaRange.y, 0., 1.);

                gl_FragColor.rgb = uPalette[ditherStep(gl_FragCoord.xy, shade, float(PALETTE_SIZE), uDither)];
  
                for (int i = 0; i < ${shockwaveCount}; i++){
                    ExplosionShockwave wave = uExplosionShockwaves[i];

                    float dist = length(vGridPosition - wave.position);
                    float band = 1.5;
                    float circ = smoothstep(wave.radius - band, wave.radius, dist) * step(dist, wave.radius);
                    float faded = circ * smoothstep(0., .5, wave.opacity);
                    int dithered = ditherStep(gl_FragCoord.xy, faded, 2., 1.);

                    if (dithered == 1){ 
                        gl_FragColor.rgb = vec3(1.);
                        break;
                    }
                }

                applyLights(vGridPosition);
            `)
    }
}

export const terrainMaterial = new TerrainMaterial()
