import { MeshPhongMaterial, SRGBColorSpace, TextureLoader, Vector2, WebGLProgramParametersWithUniforms } from "three"
import spacebitsTextureUrl from "@assets/textures/spacebits_texture_alt.png"
import dithering from "@shaders/dither.glsl"
import { syncLights } from "@components/effects/lights/lights"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"
import { damp } from "three/src/math/MathUtils.js"

export const spacebitsTexture = new TextureLoader().load(spacebitsTextureUrl)

spacebitsTexture.flipY = false
spacebitsTexture.colorSpace = SRGBColorSpace

const lightsUniform = makeLightsUniform()

function lightsUniformSync() {
    syncLights(lightsUniform)

    requestAnimationFrame(lightsUniformSync)
}

requestAnimationFrame(lightsUniformSync)
export class SpacebitsMaterial extends MeshPhongMaterial {
    uHit = { value: 0 }

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

    customProgramCacheKey() {
        return "spacebits"
    }

    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
        // swatch columns and rows in the texture
        shader.uniforms.uSwatches = { value: new Vector2(8, 4) }
        // colors picked down each swatch's gradient
        shader.uniforms.uSteps = { value: 4 }
        // light, albedo divided out, stretched from this range to the full gradient
        shader.uniforms.uLightRange = { value: new Vector2(0, 1.3) }
        shader.uniforms.uDither = { value: 1 }
        shader.uniforms.uHit = this.uHit
        shader.uniforms.uLights = lightsUniform
        // see through swatch, pixels are dithered out instead of using alpha
        shader.uniforms.uGlassSwatch = { value: new Vector2(7, 3) }
        // swatch the glass takes its colors from, blue to dark blue
        shader.uniforms.uGlassGradient = { value: new Vector2(1, 1) }
        shader.uniforms.uGlassOpacity = { value: .8 }

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
                uniform float uHit;
                uniform vec2 uGlassSwatch;
                uniform vec2 uGlassGradient;
                uniform float uGlassOpacity;

                ${dithering}
                ${lightsChunk}
            `)
            .replace("#include <dithering_fragment>", /* glsl */`
                #include <dithering_fragment>

                vec2 cell = vMapUv * uSwatches;
                bool glass = floor(cell) == uGlassSwatch;

                // glass, drop pixels in a dither pattern to see through, then color it down the glass gradient by v
                // low v is the top, so it thins out going up
                if (glass) {
                    if (ditherStep(gl_FragCoord.xy + 1., fract(cell.y) * uGlassOpacity, 2., 1.) == 0) {
                        discard;
                    }

                    cell = uGlassGradient + fract(cell);
                }

                // light hitting the surface, albedo divided out
                vec3 lumaWeights = vec3(.2126, .7152, .0722);
                float light = dot(outgoingLight, lumaWeights) / max(dot(diffuseColor.rgb, lumaWeights), .001);
                float shade = clamp((light - uLightRange.x) / (uLightRange.y - uLightRange.x), 0., 1.);
                // where the uv sits down the swatch, low v is the light end
                float albedo = 1. - fract(cell.y);
                // glass ignores light, the rest is darkened from its uv position by light
                float level = float(ditherStep(gl_FragCoord.xy, glass ? albedo : albedo * shade, uSteps, uDither));

                // swatches are light to dark top down, flipY is off so the top is the low v
                vec2 swatchUv = vec2(cell.x, floor(cell.y) + 1. - (level + .5) / uSteps) / uSwatches;

                gl_FragColor.rgb = sRGBTransferOETF(textureLod(map, swatchUv, 0.)).rgb;

                // flash on hit
                gl_FragColor.rgb = mix(
                    gl_FragColor.rgb,
                    vec3(1.),
                    uHit
                );

                applyLights(vWorldPosition);
            `)
    }
}

export const spacebits = new SpacebitsMaterial()