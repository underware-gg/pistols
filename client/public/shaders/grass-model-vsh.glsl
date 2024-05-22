uniform vec2 grassSize;
uniform vec4 grassParams;
uniform float time;
uniform sampler2D heightmap;
uniform vec4 heightParams;
uniform vec3 windDirection;
uniform float windStrength;
uniform float windSpeed;

uniform vec3 baseColor;
uniform vec3 tipColor;
uniform float opacity;

uniform float gradientOffset;

attribute float vertIndex;

varying vec4 vGrassColor;

#include <shadowmap_pars_vertex>

void main() {
    #include <begin_vertex>

    vec3 grassOffset = vec3(position.x, 0.0, position.z);
    vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
    // vec2 heightmapUV = vec2(
    //     remap(grassBladeWorldPos.x, -heightParams.x * 0.5, heightParams.x * 0.5, 0.0, 1.0),
    //     remap(grassBladeWorldPos.z, -heightParams.x * 0.5, heightParams.x * 0.5, 1.0, 0.0));
    // vec4 heightmapSample = texture2D(heightmap, heightmapUV);
    grassBladeWorldPos.y += grassParams.z - grassParams.w;

    float heightmapSampleHeight = 1.0;

    vec4 hashVal1 = hash42(vec2(grassBladeWorldPos.x, grassBladeWorldPos.z));

    float isSandy = linearstep(-11.0, -14.0, grassBladeWorldPos.y);
    float grassAllowedHash = hashVal1.w - isSandy;
    float isGrassAllowed = step(0.0, grassAllowedHash);

    float randomAngle = hashVal1.x * 2.0 * 3.14159;
    float randomShade = remap(hashVal1.y, -1.0, 1.0, 0.5, 1.0);
    float randomHeight = remap(hashVal1.z, 0.0, 1.0, 0.75, 1.5) * isGrassAllowed * heightmapSampleHeight;
    float randomWidth = (1.0 - isSandy) * heightmapSampleHeight;
    float randomLean = remap(hashVal1.w, 0.0, 1.0, 0.1, 0.4);

    vec2 hashGrassColour = hash22(vec2(grassBladeWorldPos.x, grassBladeWorldPos.z));
    float leanAnimation = noise12(vec2(time * 0.35 * windSpeed) + grassBladeWorldPos.xz * 137.423) * 0.1;

    float GRASS_SEGMENTS = grassParams.x;
    float GRASS_VERTICES = grassParams.y;

    float vertID = mod(float(vertIndex), GRASS_VERTICES);
    float zSide = -(floor(vertIndex / GRASS_VERTICES) * 2.0 - 1.0);
    float xSide = mod(vertID, 2.0);
    float heightPercent = (vertID - xSide) / (GRASS_SEGMENTS * 2.0);

    float grassTotalHeight = grassSize.y * randomHeight;
    float grassTotalWidth = grassSize.x * (1.0 - heightPercent) * randomWidth;
    float x = (xSide - 0.5) * grassTotalWidth;
    float y = heightPercent * grassTotalHeight;

    vec3 windAxis = normalize(windDirection);
    float windLeanAngle = (windStrength / 10.0) * noise12(grassBladeWorldPos.xz * 0.25 + time * 1.0 * windSpeed);
    windLeanAngle = easeIn(windLeanAngle, 2.0) * 1.25;
    windLeanAngle *= heightPercent;

    randomLean += leanAnimation;

    float easedHeight = 1.0;
    float curveAmount = -randomLean * easedHeight;

    mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(randomAngle);

    vec3 grassFaceNormal = vec3(0.0, 0.0, 1.0);
    grassFaceNormal = grassMat * grassFaceNormal;
    grassFaceNormal *= zSide;

    vec3 grassVertexNormal = vec3(0.0, -curveAmount, easedHeight);
    grassVertexNormal = grassMat * grassVertexNormal;

    vec3 grassVertexPosition = vec3(x, y, 0.0);
    grassVertexPosition = rotateX(curveAmount) * grassVertexPosition;
    grassVertexPosition = grassMat * grassVertexPosition;
    grassVertexPosition += grassOffset;

    vGrassColor = vec4(mix(baseColor, tipColor, easeIn(heightPercent, gradientOffset)) * randomShade, opacity);

    grassVertexPosition.y += grassBladeWorldPos.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(grassVertexPosition, 1.0);
}
