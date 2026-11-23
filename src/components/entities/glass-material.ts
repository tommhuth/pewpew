import { Vector2, WebGLProgramParametersWithUniforms } from "three"
import { spacebitsChunks, SpacebitsChunks, SpacebitsMaterial } from "@components/entities/spacebits-material"
import { createMaterialPool } from "./material-pool"

// spacebits with a see through swatch, pixels are dithered out instead of using alpha
export class GlassMaterial extends SpacebitsMaterial {
    chunks: SpacebitsChunks = {
        ...spacebitsChunks,
        spacebits_pars_fragment: /* glsl */`
            uniform vec2 uGlassSwatch;
            uniform vec2 uGlassGradient;
            uniform float uGlassOpacity;
        `,
        spacebits_color: /* glsl */`
            vec2 cell = vMapUv * uSwatches;
            // where the uv sits down the swatch, low v is the light end
            float albedo = 1. - fract(cell.y);

            if (floor(cell) == uGlassSwatch) {
                // drop pixels in a dither pattern to see through
                // low v is the top, so it thins out going up
                if (ditherStep(gl_FragCoord.xy + 1., fract(cell.y) * uGlassOpacity, 2., 1.) == 0) {
                    discard;
                }

                // ignores light, colored down the glass gradient by v
                gl_FragColor.rgb = getSwatchColor(map, uGlassGradient + fract(cell), albedo);
            } else {
                gl_FragColor.rgb = getSwatchColor(map, cell, albedo * shade);
            }
        `,
    }

    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
        // the see through swatch
        shader.uniforms.uGlassSwatch = { value: new Vector2(7, 3) }
        // swatch the glass takes its colors from, blue to dark blue
        shader.uniforms.uGlassGradient = { value: new Vector2(1, 1) }
        shader.uniforms.uGlassOpacity = { value: .8 }

        super.onBeforeCompile(shader)
    }
}

export const glassMaterial = new GlassMaterial()
export const glassMaterialPool = createMaterialPool(glassMaterial, () => new GlassMaterial(), 4)