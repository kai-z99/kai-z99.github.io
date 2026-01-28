---
layout: post
title: "Implementation of a Bunch of Soft Shadow Techniques"
date: 2026-01-27
author: Kai Zhang
---

<figure class="media">
    <img src="/images/shadows1.png" alt="Soft Shadows Demo">
</figure>

This article assumes you are familiar with basic shadow mapping. If not, I highly recommend to check [LearnOpenGLs tutorial](https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping).

Soft shadows are one of the most important aspects of making your world realistic. Unfortunatly, this is also one of the areas that is the most difficult to do efficiently and visually correctly. There have been many years of research at this point of different techniques that have been developed. The general consensus and the strategy used in pretty much all modern engines is shadowmapping. Ill go through 6 shadowmapping algorithms that I've selected in this article. But keep in mind there are tens and probably hundreds of other shadow mapping techniques that I havae not covered.

I've been very interested in soft soft shadows for a while, and I've found some time to implement a bunch of interesting shadow mapping techniques. For each technique, I'll  go over a bit of theory, then a tutorial on how to implement it your own engine! I'll go over my opinion on each technique and situations where I think they would be useful.








## Percentage Closer Filtering

PCF is one of the oldest and simple techniques for soft shadows. The main idea is, instead of taking one sample of your shadowmap and making a binary decision if the fragment is occluded or not:

$$
f(p)=
\begin{cases}
1 & \text{if } d(p) \le z(p) \\
0 & \text{if } d(p) > z(p)
\end{cases}
$$

instead we take $$N$$ samples in a small radius and take the average shadow value.

$$
pcf(p,r) = \frac{1}{N}\sum{f(p+(o*r))} 
$$

One question you may have is how do we get $$o$$, the offset from your sample point based on the radius. The most simple choice is a square sample, written as a double for loop. A better solution would be to use poisson disk samples as $$o$$. 

PCF requires $$N$$ samples compared to hard shadows giving it a time complexity of $$O(WHN)$$, compared to $$O(WH)$$ for hard shadows.

### Implementation

The key question we have is, how do we sample around our point? As before, the best way would be poisson disk sampling. Essentially we are taking $$N$$ points on a unit disk like this:

<figure class="media">
    <img src="/images/poisson_example.png" alt="Poisson Disk Sampling">
    <figcaption>Poisson disk sampling pattern.</figcaption>
</figure>

To further reduce banding/patterns, we rotate the disk randomly. You can use the hash function of your choice for this.

Assuming depth values are in the range $$[0,1]$$ where 1 is further away, heres the glsl for a pointlight:

<details markdown="1">
<summary>Point Light PCF (click to expand)</summary>

```glsl
// Build tangent basis around direction N
void makeBasis(vec3 N, out vec3 T, out vec3 B) 
{
    vec3 up = (abs(N.y) < 0.999) ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    T = normalize(cross(up, N));
    B = cross(N, T);
}

float shadowFactorPCF(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos,
    float diskRadiusWorld,
    int sampleCount
)
{
    vec3 L = worldPos - lightPos;
    float D = length(L);
    vec3 dir = L / max(D, 1e-5);

    float current01 = clamp((D - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

    vec3 T, B;
    makeBasis(dir, T, B);

    float rand = hash13(worldPos);
    float cs = cos(6.2831853 * rand);
    float sn = sin(6.2831853 * rand);
    mat2 rot = mat2(cs, -sn, sn, cs);

    float sum = 0.0;
    int iterations = clamp(sampleCount, 1, POISSON_MAX);
    for (int i = 0; i < iterations; i++)
    {
            vec2 o = rot * poisson[i];

            // offset on tangent plane in WORLD units at the receiver
            vec3 offset = (T * o.x + B * o.y) * diskRadiusWorld;

            float closest01 = textureCube(shadowCube, normalize(L + offset)).r;
            sum += (current01 - shadowBias > closest01) ? 0.0 : 1.0;
    }

    return sum / max(float(iterations), 1.0);
}
```

</details>

<details markdown="1">
<summary>Directional Light PCF (click to expand)</summary>

```glsl
float shadowFactorPCF(
    sampler2D shadowMap,
    mat4 lightSpaceMatrix,
    float shadowBias,
    vec3 worldPos,
    float diskRadiusUV,
    int sampleCount
)
{
    vec4 posLightSpace = lightSpaceMatrix * vec4(worldPos, 1.0);
    vec3 projCoords = posLightSpace.xyz / posLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0) return 1.0;

    float currentDepth = projCoords.z;

    float rand = hash13(worldPos);
    float cs = cos(6.2831853 * rand);
    float sn = sin(6.2831853 * rand);
    mat2 rot = mat2(cs, -sn, sn, cs);

    float sum = 0.0;
    int iterations = clamp(sampleCount, 1, POISSON_MAX);
    for (int i = 0; i < iterations; i++)
    {
        vec2 o = rot * poisson[i] * diskRadiusUV;
        float closestDepth = texture(shadowMap, projCoords.xy + o).r;
        sum += (currentDepth - shadowBias > closestDepth) ? 0.0 : 1.0;
    }

    return sum / max(float(iterations), 1.0);
}
```

</details>


