// orthographic camera, depth buffer is linear in view z so no perspective divide to undo
// all depths are view space distance from the camera in world units

// --- For sampling from depth buffer ---
float linearizeDepth(float depth, float near, float far) {
    return near + depth * (far - near);
}

// --- For world-space position ---
float getLinearDepth(vec3 worldPos, mat4 viewMatrix) {
    // camera looks down -Z
    return -(viewMatrix * vec4(worldPos, 1.0)).z;
}

// Returns scene depth minus fragment depth in world units (positive = fragment is in front of scene)
float getFragmentDepth(vec3 worldPos, sampler2D depthTex, vec2 screenUv, mat4 vMatrix, float near, float far) {
    float sceneDepth = linearizeDepth(texture2D(depthTex, screenUv).r, near, far);
    float fragmentDepth = getLinearDepth(worldPos, vMatrix);

    return sceneDepth - fragmentDepth;
}
