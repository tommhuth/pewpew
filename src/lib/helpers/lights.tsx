import { useFrame } from "@react-three/fiber"
import { Color, Vector3 } from "three"
import { Light } from "./light"
import LoopCounter from "./loop-counter"
import { ndelta } from "./utils"

export const lightColor = {
    red: new Color("#fffcde")
}
export const LIGHT_INDEX = 40
export const lightIndex = new LoopCounter(LIGHT_INDEX)
export const lights = Array.from({ length: LIGHT_INDEX }).map(() => new Light())

let lastTime = performance.now()

function fade(time: number) {
    const delta = ndelta((time - lastTime) / 1000)

    lastTime = time

    for (let i = 0; i < lights.length; i++) {
        lights[i].update(delta)
    }

    requestAnimationFrame(fade)
}

requestAnimationFrame(fade)

interface LightUniform {
    position: Vector3
    color: Color
    radius: number
    intensity: number
}

interface LightUniforms {
    value: LightUniform[];
}

export function makeLightsUniform(): LightUniforms {
    return {
        value: lights.map(() => ({
            position: new Vector3(),
            color: new Color(),
            radius: 0,
            intensity: 0,
        })),
    }
}

export const lightsHead = /* glsl */`
    struct Light {
        vec3 position;
        vec3 color;
        float radius; 
        float intensity;
    };

    uniform Light uLights[${LIGHT_INDEX}];

    float getLight(vec3 position, out vec3 fcolor) {
        float result = 0.;

        for (int i = 0; i < ${LIGHT_INDEX}; i++) {
            Light light = uLights[i];

            float falloff = 1. - clamp(length(light.position - position) / light.radius, 0., 1.);

            result = max(result,  falloff * light.intensity);

            if (falloff>.0) {
                fcolor = light.color;
            }
        }

        return result;
    }

    void colorLight(vec3 vWorldPosition) { 
        vec3 lightColor = vec3(0.);
        float light = getLight(vWorldPosition, lightColor);
        int lit = ditherStep(gl_FragCoord.xy, smoothstep(.0, .9, light), 2., 1.) ; 

        if (lit> 0) {
            vec3 palette[2] = vec3[2](lightColor, vec3(1.));  
            int index = ditherStep(gl_FragCoord.xy + vec2(1.), light, 2., .5) ;

            gl_FragColor.rgb = palette[index];
        }
    }
`

export function syncLights(uniform: LightUniforms) {
    for (let i = 0; i < lights.length; i++) {
        let light = lights[i]
        let current = uniform.value[i]

        current.position.copy(light.position)
        current.color.copy(light.color)
        current.radius = light.radius
        current.intensity = light.intensity
    }
}

export function useLights(uniform: LightUniforms) {
    useFrame(() => {
        syncLights(uniform)
    })
}

export function updateLight(
    index: number,
    radius: number,
    decay: number,
    intensity: number,
    position: Vector3,
    color: Color
) {
    const light = lights[index]

    if (!light) {
        console.warn("Light index out of bounds")
        return
    }

    light.radius = radius
    light.decay = decay
    light.intensity = intensity
    light.position.copy(position)
    light.color.copy(color)
}
