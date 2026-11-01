import { MeshPhongMaterial, SRGBColorSpace, TextureLoader, Vector2 } from "three"
import spacebitsTextureUrl from "@assets/textures/spacebits_texture_alt.png"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import { lights, syncLights } from "@components/effects/lights/lights"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"
import random from "@huth/random"

export const spacebitsTexture = new TextureLoader().load(spacebitsTextureUrl)

spacebitsTexture.flipY = false
spacebitsTexture.colorSpace = SRGBColorSpace


const lightsuni = makeLightsUniform()

function upd() {
    for (let i = 0; i < lights.length; i++) {
        syncLights(lightsuni)
    }

    requestAnimationFrame(upd)
}

requestAnimationFrame(upd)



export class SpacebitsMaterial extends MeshPhongMaterial {
    uHealth = { value: 1 }

    constructor() {
        super({
            map: spacebitsTexture,
            shininess: 100,
            toneMapped: false
        })
    }

    customProgramCacheKey() {
        return "spacebits-dither"
    }

    onBeforeCompile(shader) {
        // swatch columns and rows in the texture
        shader.uniforms.uSwatches = { value: new Vector2(8, 4) }
        // colors picked down each swatch's gradient
        shader.uniforms.uSteps = { value: 5 }
        // light, albedo divided out, stretched from this range to the full gradient
        shader.uniforms.uLightRange = { value: new Vector2(0, 1.3) }
        shader.uniforms.uDither = { value: 1 }
        shader.uniforms.uDamageOffset = { value: random.float(0, 100) }
        shader.uniforms.uHealth = this.uHealth
        shader.uniforms.uLights = lightsuni
        // see through swatch, pixels are dithered out instead of using alpha
        shader.uniforms.uGlassSwatch = { value: new Vector2(7, 3) }
        // swatch the glass takes its colors from, blue to dark blue
        shader.uniforms.uGlassGradient = { value: new Vector2(1, 1) }
        // at the bottom of the glass, fades to fully see through at the top
        shader.uniforms.uGlassOpacity = { value: 1 }

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
            .replace("#include <common>", /* glsl */`
                #include <common>
                uniform vec2 uSwatches;
                uniform float uSteps;
                uniform vec2 uLightRange;
                uniform float uDither;
                varying vec3 vWorldPosition;
                varying vec3 vPosition;
                uniform float uHealth;
                uniform float uDamageOffset;
                uniform vec2 uGlassSwatch;
                uniform vec2 uGlassGradient;
                uniform float uGlassOpacity;

                ${dithering}
                ${lightsChunk}
                ${noise}

                // 0-1, grows in noise patches as health drops, scale sets the patch size
                float getDamage(float scale) {
                    return (1. - pow(uHealth, 2.5))
                        * smoothstep(.2, 1. - uHealth * .4, noise(vWorldPosition * scale + uDamageOffset));
                }
            `)
            .replace("#include <dithering_fragment>", /* glsl */`
                #include <dithering_fragment>

                float damage = getDamage(1.);

                bool damaged = ditherStep(gl_FragCoord.xy + 2., damage, 2., .8) > 0;

                vec2 cell = vMapUv * uSwatches;
                bool glass = floor(cell) == uGlassSwatch;

                // glass, drop pixels in a dither pattern to see through, then color it down the glass gradient by v
                // low v is the top, so it thins out going up, damage punches hard edged holes in it
                if (glass) {
                    if (getDamage(3.) > .5 || ditherStep(gl_FragCoord.xy + 1., fract(cell.y) * uGlassOpacity, 2., 1.) == 0) {
                        discard;
                    }

                    cell = uGlassGradient + fract(cell);
                }

                diffuseColor.rgb = mix(
                    gl_FragColor.rgb,
                    gl_FragColor.rgb,
                    clamp(vPosition.y / 2., 0., 1.)
                );

                // light hitting the surface, albedo divided out
                vec3 lumaWeights = vec3(.2126, .7152, .0722);
                float light = dot(outgoingLight, lumaWeights) / max(dot(diffuseColor.rgb, lumaWeights), .001);
                float shade = clamp((light - uLightRange.x) / (uLightRange.y - uLightRange.x), 0., 1.);
                // glass ignores light, low v is the light end of the swatch
                float level = float(ditherStep(gl_FragCoord.xy, glass ? 1. - fract(cell.y) : shade, uSteps, uDither));

                // damaged pixels step down the swatch first, keeps its hue shift
                if (damaged) {
                    level = max(level - 2., 0.);
                }

                // swatches are light to dark top down, flipY is off so the top is the low v
                vec2 swatchUv = vec2(cell.x, floor(cell.y) + 1. - (level + .5) / uSteps) / uSwatches;

                gl_FragColor.rgb = sRGBTransferOETF(textureLod(map, swatchUv, 0.)).rgb;

                if (damaged) {
                    gl_FragColor.rgb *= .85;
                }

                colorLight(vWorldPosition);
            `)
    }
}


export const spacebits = new SpacebitsMaterial()