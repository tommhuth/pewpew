import { useCallback, useMemo } from "react"
import { IUniform, WebGLRenderer, WebGLProgramParametersWithUniforms } from "three"

// djb2, cheap stable key from the injected source
function hash(input: string) {
    let h = 5381

    for (let i = 0; i < input.length; i++) {
        h = (h * 33) ^ input.charCodeAt(i)
    }

    return (h >>> 0).toString(36)
}

export interface ShaderPart {
    head?: string
    main?: string
}

type UniformsRecord = Record<string, IUniform>

type ReturnUniformsRecord<T extends Record<string, IUniform> | undefined> = T extends UniformsRecord
    ? {
        [K in keyof T]: {
            value: T[K]["value"];
            needsUpdate?: boolean;
        };
    }
    : undefined;

export interface UseShaderParams<T extends UniformsRecord> {
    uniforms?: T | undefined
    shared?: string
    vertex?: ShaderPart
    fragment?: ShaderPart
}

interface ReturnUseShader<T extends UniformsRecord | undefined> {
    uniforms: ReturnUniformsRecord<T>
    onBeforeCompile: (shader: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer) => void
    customProgramCacheKey: () => string
}

export function useShader<T extends UniformsRecord>({
    uniforms: incomingUniforms,
    shared = "",
    vertex = {
        head: "",
        main: "",
    },
    fragment = {
        head: "",
        main: "",
    }
}: UseShaderParams<T>): ReturnUseShader<T> {
    const uniforms = useMemo(() => {
        return incomingUniforms || {}
    }, [])
    // same injected source = same key, so three shares one program across instances
    // uniforms stay per material, three keeps them per material even when the program is shared
    const key = useMemo(() => {
        return hash([shared, vertex.head, vertex.main, fragment.head, fragment.main].join("\u0000"))
    }, [shared, vertex.head, vertex.main, fragment.head, fragment.main])
    const customProgramCacheKey = useCallback(() => key, [key])
    const onBeforeCompile = useCallback((shader: WebGLProgramParametersWithUniforms) => {
        shader.uniforms = {
            ...shader.uniforms,
            ...uniforms
        }

        shader.vertexShader = shader.vertexShader.replace("#include <common>", /* glsl */`
            #include <common>
            
            ${shared}
            ${vertex?.head ?? ""}  
        `)
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", /* glsl */`
            #include <begin_vertex>
    
            ${vertex?.main ?? ""}  
        `)
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>", /* glsl */`
            #include <common>

            ${shared}
            ${fragment?.head ?? ""}  
        `)
        shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", /* glsl */`
            #include <dithering_fragment> 

            ${fragment?.main ?? ""}  
        `)
    }, [shared, vertex.head, vertex.main, fragment.head, fragment.main])

    return {
        uniforms: uniforms as ReturnUniformsRecord<T>,
        customProgramCacheKey,
        onBeforeCompile
    }
}