import { Camera, Group, MeshLambertMaterial, MeshPhongMaterial, Object3D, Scene, SRGBColorSpace, TextureLoader, Vector2, WebGLRenderer } from "three"
import spacebitsTextureUrl from "@assets/textures/spacebits_texture_alt.png"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import { lights, lightsHead, makeLightsUniform, syncLights } from "./helpers/lights"
import { BufferGeometry } from "three/webgpu"
import random from "@huth/random"

export const white = new MeshLambertMaterial({ color: "#fff" })
export const floor = new MeshLambertMaterial({ color: "#eee" })
export const floorEdge = new MeshLambertMaterial({ color: "#3a4a8a" })
export const muzzle = new MeshLambertMaterial({
    color: "#d9f3ff",
    emissive: "#fff",
    emissiveIntensity: .35,
})

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
        shader.uniforms.uHealth = { value: 1 }
        shader.uniforms.uDamageOffset = { value: random.float(0, 100) }
        shader.uniforms.uHealth = this.uHealth
        shader.uniforms.uLights = lightsuni

        shader.vertexShader = shader.vertexShader.replace("#include <common>", /* glsl */`
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

            ${dithering}
            ${lightsHead}
            ${noise}
        `)
            .replace("#include <dithering_fragment>", /* glsl */`
            #include <dithering_fragment>

            diffuseColor.rgb = mix(
                gl_FragColor.rgb,
                gl_FragColor.rgb,
                clamp(vPosition.y / 2., 0., 1.)
            );

            float damage = (1. - pow(uHealth, 2.5))
                * smoothstep(.2, 1. - uHealth * .4, noise(vWorldPosition * 1. + uDamageOffset));

            bool damaged = ditherStep(gl_FragCoord.xy + 2., damage, 2., .8) > 0;

            // light hitting the surface, albedo divided out
            vec3 lumaWeights = vec3(.2126, .7152, .0722);
            float light = dot(outgoingLight, lumaWeights) / max(dot(diffuseColor.rgb, lumaWeights), .001);
            float shade = clamp((light - uLightRange.x) / (uLightRange.y - uLightRange.x), 0., 1.);
            float level = float(ditherStep(gl_FragCoord.xy, shade, uSteps, uDither));

            // damaged pixels step down the swatch first, keeps its hue shift
            if (damaged) {
                level = max(level - 2., 0.);
            }
            
            // swatches are light to dark top down, flipY is off so the top is the low v
            vec2 cell = vMapUv * uSwatches;
            vec2 swatchUv = vec2(cell.x, floor(cell.y) + 1. - (level + .5) / uSteps) / uSwatches;

            gl_FragColor.rgb = sRGBTransferOETF(textureLod(map, swatchUv, 0.)).rgb;

            if (damaged){
                gl_FragColor.rgb *= .85;
            }

            colorLight(vWorldPosition); 
        `)
    }
}


export const spacebits = new SpacebitsMaterial()