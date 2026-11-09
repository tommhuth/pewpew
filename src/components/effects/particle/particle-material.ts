import { MeshPhongMaterial, WebGLProgramParametersWithUniforms } from "three"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"
import { lightsChunk, makeLightsUniform } from "@components/effects/lights/light-shader"

export class ParticleMaterial extends MeshPhongMaterial {
    toneMapped = false
    // synced by the owner with useLights
    uLights = makeLightsUniform()

    constructor() {
        super({
            color: "#fff",
        })
    }

    customProgramCacheKey() {
        return "particle"
    }

    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
        shader.uniforms.uLights = this.uLights

        shader.vertexShader = shader.vertexShader
            .replace("#include <common>",  /* glsl */`
                #include <common>
                flat varying float vInstanceId;
                varying vec3 vWorldPosition;
            `)
            .replace("#include <begin_vertex>",  /* glsl */`
                #include <begin_vertex>
                vInstanceId = float(gl_InstanceID);

                #ifdef USE_INSTANCING
                    vWorldPosition = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;
                #else
                    vWorldPosition = (modelMatrix * vec4(transformed, 1.)).xyz;
                #endif
            `)

        shader.fragmentShader = shader.fragmentShader.replace("#include <common>",  /* glsl */`
            #include <common>
            flat varying float vInstanceId;
            varying vec3 vWorldPosition;
        `)

        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "")
        shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", /* glsl */`
            float light = luma(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse);
            #include <opaque_fragment>
        `)
        shader.fragmentShader = shader.fragmentShader
            .replace("#include <common>", /* glsl */`
                #include <common>

                ${utils}
                ${dithering}
                ${lightsChunk}
                ${noise}
            `)
        shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", /* glsl */`
            vec3 col = vColor.rgb * map(random(vec2(vInstanceId, 0.)), 0., 1., .85, 1.1);
            // filled per element, mali skips default precision on array constructors
            vec3 palette[3];
            palette[0] = col * .9;
            palette[1] = col;
            palette[2] = col + vec3(.1);
            int dither = ditherStep(gl_FragCoord.xy, map(light, .0, 5., 0., 1.), 3., 1.);

            gl_FragColor.rgb = palette[dither] ;

            applyLights(vWorldPosition);
        `)
    }
}
