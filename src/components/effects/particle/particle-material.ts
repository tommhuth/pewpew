import { MeshPhongMaterial, WebGLProgramParametersWithUniforms } from "three"
import utils from "@shaders/utils.glsl"
import dithering from "@shaders/dither.glsl"
import noise from "@shaders/noise.glsl"

export class ParticleMaterial extends MeshPhongMaterial {
    toneMapped = false
    constructor() {
        super({
            color: "#fff",
        })
    }

    customProgramCacheKey() {
        return "particle"
    }

    onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
        shader.vertexShader = shader.vertexShader
            .replace("#include <common>",  /* glsl */`
                #include <common>
                flat varying float vInstanceId;
            `)
            .replace("#include <begin_vertex>",  /* glsl */`
                #include <begin_vertex>\nvInstanceId = float(gl_InstanceID);
            `)

        shader.fragmentShader = shader.fragmentShader.replace("#include <common>",  /* glsl */`
            #include <common>\nflat varying float vInstanceId;
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
                ${noise}
            `)
        shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", /* glsl */`
            vec3 col = vColor.rgb * map(random(vec2(vInstanceId, 0.)), 0., 1., .85, 1.1);
            vec3 palette[3] = vec3[3](col * .9,col , col + vec3(.1));
            int dither = ditherStep(gl_FragCoord.xy, map(light, .0, 5., 0., 1.), 3., 1.);

            gl_FragColor.rgb = palette[dither] ;
        `)
    }
}
