import { ThreeElements } from "@react-three/fiber"
import { Color, Vector2 } from "three"
import { useShader } from "@src/hooks/use-shader"
import { cellsize, w } from "@lib/world/terrain"
import { useLights } from "@components/effects/lights/lights"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import utils from "@shaders/utils.glsl"
import easings from "@shaders/easings.glsl"

const palette = [
    "#5e6a82",
    "#ccd0d9",
    "#f1f2f6",
    "#fbfbfd",
].map(i => new Color(i).convertLinearToSRGB())

type TerrainMaterialProps = Omit<ThreeElements["meshPhongMaterial"], "onBeforeCompile" | "customProgramCacheKey">

export default function TerrainMaterial(props: TerrainMaterialProps) {
    const {
        uniforms,
        onBeforeCompile,
        customProgramCacheKey
    } = useShader({
        shared: /* glsl */`
            varying vec3 vGridPosition;
            varying vec3 vGridNormal;
        `,
        uniforms: {
            uCellSize: { value: cellsize },
            // cell edges on x sit at (ix - w / 2) * cellsize
            uGridOffset: { value: new Vector2((w / 2 * cellsize) % cellsize, 0) },
            uPalette: { value: palette },
            // luma stretched from this range to the full palette
            uLumaRange: { value: new Vector2(0, .4) },
            uDither: { value: 1 },
            uLineWidth: { value: 1.5 },
            uLights: makeLightsUniform(),
        },
        vertex: {
            main: /* glsl */`
                #ifdef USE_INSTANCING
                    mat4 gridMatrix = modelMatrix * instanceMatrix;
                #else
                    mat4 gridMatrix = modelMatrix;
                #endif

                vGridPosition = (gridMatrix * vec4(transformed, 1.)).xyz;
                vGridNormal = normalize(mat3(gridMatrix) * objectNormal);
            `
        },
        fragment: {
            head: /* glsl */`
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
            `,
            main: /* glsl */`
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
                );
                gl_FragColor.rgb *= 1. - line * .1;
                gl_FragColor.rgb = mix(gl_FragColor.rgb , vec3(0.), smoothstep(0., -6., vGridPosition.y));

                float shade = map(luma(gl_FragColor.rgb), uLumaRange.x, uLumaRange.y, 0., 1.);

                gl_FragColor.rgb = uPalette[ditherStep(gl_FragCoord.xy, shade, float(PALETTE_SIZE), uDither)];
 
                applyLights(vGridPosition); 
            `
        }
    })

    useLights(uniforms.uLights)

    return (
        <meshPhongMaterial
            shininess={6}
            specular="#666"
            toneMapped={false}
            color="#212629"
            onBeforeCompile={onBeforeCompile}
            customProgramCacheKey={customProgramCacheKey}
            {...props}
        />
    )
}
