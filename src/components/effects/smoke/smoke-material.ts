import { ShaderMaterial, UniformsLib, UniformsUtils } from "three"
import { makeDepthUniforms } from "@components/effects/depth/depth-shader"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import depth from "@components/effects/depth/depth.glsl"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"

const vertexShader = /* glsl */`
    #include <common>
    #include <shadowmap_pars_vertex>
 
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    flat varying float vInstanceId;

    void main() {
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.);
 
        vWorldPosition = worldPosition.xyz;
        // view space, uniform instance scale so no per-axis correction needed
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vInstanceId = float(gl_InstanceID);

        // done by hand, the shadowmap_vertex chunk wants the whole standard vertex setup 
        #pragma unroll_loop_start
        for (int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i++) {
            vDirectionalShadowCoord[i] = directionalShadowMatrix[i] * worldPosition;
        }
        #pragma unroll_loop_end 

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`

const fragmentShader = /* glsl */`
    #include <common>
    #include <packing>
    #include <shadowmap_pars_fragment>

    uniform float uTime;
    uniform sampler2D uDepthTexture;
    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform vec2 uResolution;
 
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    flat varying float vInstanceId;

    ${utils}
    ${noise}
    ${dithering}
    ${depth}
    ${lightsChunk}

    float getSmokeEdge(vec3 normal, vec3 position) {
        float edgeSpeed = .25;
        vec3 noiseInput = vec3(
            normal.x * .75, 
            normal.y * .75 + position.y * .95, 
            random(vec2(vInstanceId, 0.))
        ) + uTime * edgeSpeed;
        float noiseValue = noise(noiseInput) * map(position.y, .5, 1., 0., 1.); 
        
        return smoothstep(0.1, .5, normal.z - noiseValue * .75);
    }

    float getIntersection(vec3 position, mat4 viewMatrix) {
        float depth = getFragmentDepth(
            position, 
            uDepthTexture, 
            gl_FragCoord.xy / uResolution, 
            viewMatrix,
            uCameraNear,
            uCameraFar
        );
        float intersectionThreshold = 1.85;

        return smoothstep(.0, 1., clamp(abs(depth / intersectionThreshold), 0., 1.)); 
    }

    void main() {
        vec3 normal = normalize(vNormal); 
        const vec3 sunWorld = vec3(-.35, .2, -.2);
        vec3 sun = normalize((viewMatrix * vec4(sunWorld, 0.)).xyz);  
        float sunLit = dot(normal, sun); 
 
        float intersection = getIntersection(vWorldPosition, viewMatrix);
        float edge = getSmokeEdge(normal, vWorldPosition);
        int dithered = ditherStep(gl_FragCoord.xy, intersection * edge, 2., .5);

        if (dithered == 0){
            discard;
        }
  
        vec3 palette[3];
        palette[0] = vec3(.71, .76, .85);  
        palette[1] = vec3(.87, .89, .95);  
        palette[2] = vec3(1.); 

        float palletteValue = mix(1., smoothstep(.1, .7, sunLit - edge * .25), normal.y);
        int stepValue = ditherStep(gl_FragCoord.xy, palletteValue, float(palette.length()), .6);
      
        gl_FragColor.rgb = palette[stepValue];
 
        float shadow = getShadow(
            directionalShadowMap[0],
            directionalLightShadows[0].shadowMapSize,
            directionalLightShadows[0].shadowIntensity,
            directionalLightShadows[0].shadowBias,
            directionalLightShadows[0].shadowRadius,
            vDirectionalShadowCoord[0]
        );

        if (ditherStep(gl_FragCoord.xy, shadow, 2., .5) == 0) {
            gl_FragColor.rgb *= .9 + vec3(0., 0., .045);
        }

        gl_FragColor.a = 1.; 
        applyLights(vWorldPosition); 
    }
`

function makeUniforms() {
    return {
        // shadow map and matrices, filled in by three with lights on
        ...UniformsUtils.clone(UniformsLib.lights),
        uTime: { value: 0 },
        // synced by the owner with useLights
        uLights: makeLightsUniform(),
        ...makeDepthUniforms(),
    }
}

export class SmokeMaterial extends ShaderMaterial {
    declare uniforms: ReturnType<typeof makeUniforms>
    toneMapped = false
    //wireframe = true
    lights = true

    constructor() {
        super({
            uniforms: makeUniforms(),
            vertexShader,
            fragmentShader,
        })
    }
}