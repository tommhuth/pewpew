const mat4 bayerTable = mat4(
    0.0, 8.0, 2.0, 10.0,
    12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,
    15.0, 7.0, 13.0, 5.0
);

// ordered dither of a 0-1 color into count steps per channel
// strength 1 dithers fully between neighbouring steps, 0 gives hard bands
vec3 dither(vec2 position, vec3 color, float colorCount, float strength) {
    float threshold = .5 + ((bayerTable[int(position.x) % 4][int(position.y) % 4] + .5) / 16. - .5) * strength;

    return clamp(floor(color * (colorCount - 1.) + threshold), 0., colorCount - 1.) / (colorCount - 1.);
}

// ordered dither of a 0-1 value into count steps, for picking from a palette
// strength 1 dithers fully between neighbouring steps, 0 gives hard bands
int ditherStep(vec2 position, float value, float count, float strength) {
    float threshold = .5 + ((bayerTable[int(position.x) % 4][int(position.y) % 4] + .5) / 16. - .5) * strength;

    return int(clamp(floor(value * (count - 1.) + threshold), 0., count - 1.));
}
