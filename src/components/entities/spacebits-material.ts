import { MeshPhongMaterial, SRGBColorSpace, TextureLoader, Vector2, WebGLProgramParametersWithUniforms } from "three"
import spacebitsTextureUrl from "@assets/textures/spacebits_texture_alt.png"
import dithering from "@shaders/dither.glsl"
import { syncLights } from "@components/effects/lights/lights"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"
import { damp } from "three/src/math/MathUtils.js"
import { createMaterialPool } from "@components/entities/material-pool"

export const spacebitsTexture = new TextureLoader().load(spacebitsTextureUrl)

spacebitsTexture.flipY = false
spacebitsTexture.colorSpace = SRGBColorSpace

const lightsUniform = makeLightsUniform()

function lightsUniformSync() {
    syncLights(lightsUniform)

    requestAnimationFrame(lightsUniformSync)
}

requestAnimationFrame(lightsUniformSync)

export const spacebitsChunks = {
    // extra fragment declarations, uniforms and functions the other chunks need
    spacebits_pars_fragment: "",
    // the surface color, picked down a swatch from the texture and darkened by light
    spacebits_color: /* glsl */`
        vec2 cell = vMapUv * uSwatches;
        // where the uv sits down the swatch, low v is the light end
        float albedo = 1. - fract(cell.y);

        gl_FragColor.rgb = getSwatchColor(map, cell, albedo * shade);
    `,
    // flash on hit
    spacebits_hit: /* glsl */`
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.), uHit);
    `,
}

export type SpacebitsChunks = Record<keyof typeof spacebitsChunks, string>

export class SpacebitsMaterial extends MeshPhongMaterial {
    uHit = { value: 0 }
    // subclasses swap entries out to change parts of the shader
    chunks: SpacebitsChunks = spacebitsChunks

    constructor() {
        super({
            map: spacebitsTexture,
            shininess: 100,
            toneMapped: false
        })
    }

    update(delta: number) {
        this.uHit.value = damp(this.uHit.value, 0, 9, delta)
    }

    // the chunks are all that differ between subclasses, so a subclass cant end up on another ones program
    customProgramCacheKey() {
        return "spacebits" + Object.values(this.chunks).join()
    }

    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
        // swatch columns and rows in the texture
        shader.uniforms.uSwatches = { value: new Vector2(8, 4) }
        // colors picked down each swatch's gradient
        shader.uniforms.uSteps = { value: 4 }
        // light, stretched from this range to the full gradient
        shader.uniforms.uLightRange = { value: new Vector2(0, 1.3) }
        shader.uniforms.uDither = { value: 1 }
        shader.uniforms.uHit = this.uHit
        shader.uniforms.uLights = lightsUniform

        shader.vertexShader = shader.vertexShader
            .replace("#include <common>", /* glsl */`
                #include <common>
                varying vec3 vWorldPosition;
                varying vec3 vPosition;
            `)
            .replace("#include <begin_vertex>", /* glsl */`
                #include <begin_vertex>
                #ifdef USE_INSTANCING
                    vWorldPosition = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;
                #else
                    vWorldPosition = (modelMatrix * vec4(transformed, 1.)).xyz;
                #endif

                vPosition = transformed;
            `)

        shader.fragmentShader = shader.fragmentShader
            .replace("#include <map_fragment>", "")
            .replace("#include <common>", /* glsl */`
                #include <common>
                uniform vec2 uSwatches;
                uniform float uSteps;
                uniform vec2 uLightRange;
                uniform float uDither;
                uniform float uHit;
                varying vec3 vWorldPosition;
                varying vec3 vPosition;

                ${dithering}
                ${lightsChunk}

                // dithered pick down the gradient of the swatch the cell sits in, value 1 is the light end
                // takes the texture as map isnt declared yet this high up
                vec3 getSwatchColor(sampler2D tex, vec2 cell, float value) {
                    float level = float(ditherStep(gl_FragCoord.xy, value, uSteps, uDither));
                    // swatches are light to dark top down, flipY is off so the top is the low v
                    vec2 uv = vec2(cell.x, floor(cell.y) + 1. - (level + .5) / uSteps) / uSwatches;

                    return sRGBTransferOETF(textureLod(tex, uv, 0.)).rgb;
                }

                #include <spacebits_pars_fragment>
            `)
            .replace("#include <dithering_fragment>", /* glsl */`
                #include <dithering_fragment>

                // light hitting the surface 
                float shade = clamp((luminance(outgoingLight) - uLightRange.x) / (uLightRange.y - uLightRange.x), 0., 1.);

                #include <spacebits_color>
                #include <spacebits_hit>

                applyLights(vWorldPosition);
            `)
            // resolve our own special chunks
            .replace(/#include <(spacebits_\w+)>/g, (_, name: keyof SpacebitsChunks) => this.chunks[name])
    }
}

export const spacebits = new SpacebitsMaterial()
export const spacebitsPool = createMaterialPool(spacebits, () => new SpacebitsMaterial())