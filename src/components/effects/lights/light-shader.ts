import { Color, Vector3 } from "three"
import { LIGHT_INDEX, lights } from "./lights"

interface LightUniform {
    position: Vector3
    innerColor: Color
    outerColor: Color
    radius: number
    intensity: number
}

export interface LightUniforms {
    value: LightUniform[];
}

export function makeLightsUniform(): LightUniforms {
    return {
        value: lights.map(() => ({
            position: new Vector3(),
            innerColor: new Color(),
            outerColor: new Color(),
            radius: 0,
            intensity: 0,
        })),
    }
}

export const lightsChunk = /* glsl */`
    struct Light {
        vec3 position;
        vec3 innerColor;
        vec3 outerColor;
        float radius;
        float intensity;
    };

    uniform Light uLights[${LIGHT_INDEX}];

    float getLight(vec3 position, out vec3 innerColor, out vec3 outerColor) {
        float result = 0.;

        for (int i = 0; i < ${LIGHT_INDEX}; i++) {
            Light light = uLights[i];

            float falloff = 1. - clamp(length(light.position - position) / light.radius, 0., 1.);

            result = max(result,  falloff * light.intensity);

            if (falloff>.0) {
                innerColor = light.innerColor;
                outerColor = light.outerColor;
            }
        }

        return result;
    }

    void colorLight(vec3 vWorldPosition) {
        vec3 innerColor = vec3(0.);
        vec3 outerColor = vec3(0.);
        float light = getLight(vWorldPosition, innerColor, outerColor);
        int lit = ditherStep(gl_FragCoord.xy, smoothstep(.0, .9, light), 2., 1.) ;

        if (lit> 0) {
            vec3 palette[2] = vec3[2](outerColor, innerColor);
            int index = ditherStep(gl_FragCoord.xy + vec2(1.), light, 2., .5) ;

            gl_FragColor.rgb = palette[index];
        }
    }
`
