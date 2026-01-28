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


## Hard Shadows Definition

The main idea of hard shadows is making a binary decision if the fragment at  is occluded or not:

$$
f(p)=
\begin{cases}
1 & \text{if } d(p) \le z(p) \\
0 & \text{if } d(p) > z(p)
\end{cases}
$$

where $$p$$ is the receiver’s coordinate in the shadow map (UV for 2D shadow maps, or a direction vector for cube shadow maps). $$d(p) \in [0,1]$$ is the depth of your target fragment as seen from the light, and $$z(p) \in [0,1]$$ is the depth stored in your shadowmap. Using this convention, the deepest possible fragment is at $$1.0$$ (Far plane) and $$0.0$$ would be your near plane. Your final fragment's shaded color is then $$color * f(p)$$.



## 1: Percentage Closer Filtering

PCF is one of the oldest and simple techniques for soft shadows. 

instead we take $$N$$ samples, each being offset by some $$o_i$$ and take the average shadow value.

$$
pcf(p,r) = \frac{1}{N}\sum^N{f(p+ro_i)} 
$$

Note that $$r$$ here is a user defined param that controls the softness of the shadow.

If your using a pointlight, since your sampling a direction, we multiply $$o_i$$ by the vector's tangent basis. 

One question you may have is how do we get $$o$$, the offset from your sample point. The most simple choice is a square sample like this for $$N = 9$$:

```glsl
float shadow = 0.0;

for (int i = -1; i <= 1; i++)
{
    for (int j = -1; j <= 1; j++)
    {
        vec2 o_i = vec2(i,j);
        shadow += f(uv + o_i);
    }
}

return shadow / 9.0;
```

The issue with this is that of course, we are sampling in a square pattern for each pixel, leaving you with very flat penumbra.

A better solution would be to use poisson disk samples as $$o$$. These are essentially random points on a unit circle which have a minimum distance between then to prevent clumping.

<figure class="media">
    <img src="/images/poisson_example.png" alt="Poisson Disk Sampling">
    <figcaption>Poisson disk sampling pattern.</figcaption>
</figure>

```glsl
const vec2 poisson[POISSON_MAX] = vec2[](
        vec2(-0.0936905, 0.3196758),
        vec2(0.1592735, -0.9686295),
        vec2(0.9430245, 0.3139912),
        vec2(-0.7416366, -0.4377831),
        ... //and so on
);

for (int i = 0; i < N; i++)
{
        vec2 o_i = poisson[i];
        ...
}
```

This gives you a much nicer result and removes most of the patterns that come from square samples. 

<div class="note" markdown="1">
When using high resolution shadowmaps with very simple textures, even patterns from poisson sampling can show up. So if your scene needs it, consider rotating each poisson sample randomly when using it.

```glsl
float rand = hash13(worldPos); //use whatever hash you want
float cs = cos(6.2831853 * rand);
float sn = sin(6.2831853 * rand);
rot = mat2(cs, -sn, sn, cs);

for (int i = 0; i < N; i++)
{
        vec2 o_i = rot * poisson[i];
        ...
}
```

</div>

PCF requires $$N$$ samples compared to hard shadows giving it a time complexity of $$O(WHN)$$, compared to $$O(WH)$$ for hard shadows.

### Implementation

Assuming depth values are in the range $$[0,1]$$ heres the glsl code:

<details markdown="1">
<summary>64 pregenerated poisson samples</summary>
```glsl
const int POISSON_MAX = 64;
const vec2 poisson[POISSON_MAX] = vec2[](
    vec2(-0.0936905, 0.3196758),
    vec2(0.1592735, -0.9686295),
    vec2(0.9430245, 0.3139912),
    vec2(-0.7416366, -0.4377831),
    vec2(-0.9517487, 0.2963554),
    vec2(0.8581337, -0.4240460),
    vec2(0.3276062, 0.9244621),
    vec2(-0.5325066, 0.8410385),
    vec2(0.0902534, -0.3503742),
    vec2(0.4452095, 0.2580113),
    vec2(-0.4462856, -0.0426502),
    vec2(-0.2192158, -0.6911137),
    vec2(-0.1154335, 0.8248222),
    vec2(0.5149567, -0.7502338),
    vec2(-0.5523247, 0.4272514),
    vec2(0.6470215, 0.7474022),
    vec2(-0.5987766, -0.7512833),
    vec2(0.1604507, 0.5460774),
    vec2(0.5947998, -0.2146744),
    vec2(-0.1203411, -0.1301079),
    vec2(-0.7304786, -0.0100693),
    vec2(-0.3897587, -0.4665619),
    vec2(0.3929337, -0.5010948),
    vec2(-0.3096867, 0.5588146),
    vec2(0.0617981, 0.0729416),
    vec2(0.6455986, 0.0441933),
    vec2(0.8934509, 0.0736939),
    vec2(-0.3580975, 0.2806469),
    vec2(-0.8682281, -0.1990303),
    vec2(0.1853630, 0.3213367),
    vec2(0.8400612, -0.2001190),
    vec2(-0.1598610, 0.1038342),
    vec2(0.6632416, 0.3067062),
    vec2(0.1562584, -0.5610626),
    vec2(-0.6930340, 0.6913887),
    vec2(-0.9402866, 0.0447434),
    vec2(0.3029106, 0.0949703),
    vec2(0.6464897, -0.4666451),
    vec2(0.4356628, -0.0710125),
    vec2(0.1253822, 0.9892166),
    vec2(0.0349884, -0.7968109),
    vec2(0.3935608, 0.4609676),
    vec2(0.3085465, -0.7842533),
    vec2(-0.3090832, 0.9020988),
    vec2(-0.6518704, -0.2503952),
    vec2(-0.4037193, -0.2611179),
    vec2(0.3401214, -0.3047142),
    vec2(-0.0197372, 0.6478714),
    vec2(0.1741608, -0.1682285),
    vec2(-0.5128918, 0.1448544),
    vec2(-0.1596546, -0.8791054),
    vec2(0.6987045, -0.6843052),
    vec2(-0.7445076, 0.5035095),
    vec2(-0.5862702, -0.5531025),
    vec2(0.4112572, 0.7500054),
    vec2(-0.1080467, -0.5329178),
    vec2(0.8587891, 0.4838005),
    vec2(-0.7647934, 0.2709858),
    vec2(-0.1493771, -0.3147511),
    vec2(-0.4676369, 0.6570358),
    vec2(0.6295372, 0.5629555),
    vec2(0.0689201, 0.8124840),
    vec2(-0.0566467, 0.9952820),
    vec2(-0.4230408, -0.7129914)
);
```
</details>

<details markdown="1">
<summary>Point Light PCF</summary>

```glsl
float hash13(vec3 p) 
{
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}


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
<summary>Directional Light PCF</summary>

```glsl
float hash13(vec3 p) 
{
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}


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

### Discussion

PCF is one of the most popular techniques for a reason. Even though it was founded many years ago, its still the go-to for many simple engines, or platforms with limited compute like mobile. The reason is not surprising, its just easy and effective for decent soft shadows, and the performance is excellent.

For me persononlly, I'd use PCF when I jsut want quick and easy soft shadows, without having to think to much about it.

The main concern of this technique is that your sample radius is constant. This means it will not accurately represent how shadows behave in the real world, where the [penumbra](https://en.wikipedia.org/wiki/Umbra,_penumbra_and_antumbra#Penumbra) widens as the receiver gets farther from the occluder. With a fixed-radius kernel, you get the same softness everywhere. If you want to know how to fix this, read on.

## 2. Percentage Closer Soft Shadows
In previous section, we discussed on why using PCF with a fixed radius is not accurate to the real world. In reality, as a light source comes closer to an object, the edges of the shadows soften (the penumbra widens), and vise versa. Also note that a larger light will cast different shadows than a smaller one. In fact, an infintessiamly small light (like a point light), which doesnt exist in reality, would cast perfectly hard shadows. So we need to take in light size as a factor as well.

The technique developed by NVIDIA in 2007, PCSS, is the solution. Take a look at this diagram:


<figure class="media">
    <img src="/images/pcss_diagram.png" alt="pcssDiagram">
    <figcaption>Estimating a penumbra from an area light.</figcaption>
</figure>

Given $$w_{light}$$ which is an artist tuned approximation of emitter radius, we can estimate the size of the penumbra on the surface with some simple geometry. For point lights:

$$
w_{light}^{world} = w_{light}
$$

$$
w_{penumbra}^{world} = \frac{(d_{reciever} - d_{blocker}) \cdot w_{light}^{world}}{d_{blocker}}
$$

where $$d_{receiver}$$ is distance from frag to light in world units,  and $$d_{blocker}$$ is the average depth of its occluders in world space, using $$M$$ samples.

For a directional light, we need to convert $$w_{light}$$ to uv:

$$
w_{light}^{uv} = \frac{w_{light}}{w_{frustum}}
$$

$$
w_{penumbra}^{uv} = \frac{(d_{receiver} - d_{blocker}) \cdot w_{light}^{uv}}{d_{blocker}}
$$


Where $$d_{receiver} = d(p)$$, $$d_{bblocker}$$ is the average depth of its occluders in shadowmap depth space ($$[0,1]$$,) $$w_{frustum}$$ is the width of the shadowmap frustum $$(orthoR - orthoL)$$.

We can then run PCF with our radius $$r$$ proportional to $$w_{penumbra}$$. Naturally, the main questions now become how do you find $$d_{blocker}$$, and how to you use $$w_{penumbra}$$ to get a PCF radius.

To answer the first question, this again involves poisson disk sampling. Lets sample our shadowmap $$M$$ times around $$p$$, each one being by $$o_i$$ again. To take into account the light's size, each offset will be multiplied by a value $$s$$ derived from the light’s apparent size from that point. Add up and divide by $$M$$ to get the average blocker depth.

$$
d_{blocker} = \frac{1}{M}\sum^M{z(p + so_i)}
$$

For a pointlight with $$k$$ being artist's choice, (default to 1): We can use a small angle approximation:

$$
s = k \cdot \frac{w_{light}^{world}}{d(p)}
$$

For a directional light:

$$
s = k \cdot w_{light}^{uv}
$$



<div class="note" markdown="1">
Notice that if your light is infinitesimally small (point light), 

$$
\lim_{s \rightarrow 0}\frac{1}{M}\sum^M{z(p + so_i)} = z(p)
$$

The average blocker distance for a fragment is exactly your shadowmap depth!

</div>

Now once we have our average blocker depth $$d_{blocker}$$, we can compute $$w_{penumbra}$$ with the previous formula. Our last question is, given $$w_{penumbra}$$, what radius $$r$$ do we need for our PCF sample?

For a point light, it nicely turns out that:

$$
r = w_{penumbra}^{world}
$$

For a directional light (orthographic projection), we have

$$
r = w_{penumbra}^{uv}
$$

We finally have all the hard stuff out of the way. At this point we simply run PCF shadows with our newly calculated $$r$$ as the radius. That completes PCSS.

### Implementation

<details markdown="1">
<summary>Point Light PCSS </summary>

```glsl
float getAvgBlockerDepth(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos,
    float lightRadius,
    int numSamples
)
{
    vec3 lightToFrag = worldPos - lightPos;
    float receiverDist = length(lightToFrag);
    vec3 lightDir = normalize(lightToFrag);
    float receiverDepthNormalized = clamp((receiverDist - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

    vec3 T, B;
    makeBasis(lightDir, T, B);

    // Angular size of the light source from receiver point
    float lightAngle = lightRadius / max(receiverDist, 1e-5);
    float searchAngle = lightAngle * 1.5;

    // Random rotation for poisson disk
    float rand = hash13(worldPos);
    float cs = cos(6.2831853 * rand); 
    float sn = sin(6.2831853 * rand);
    mat2 rot = mat2(cs, -sn, sn, cs);

    float blockerDepthSum = 0.0;
    int numBlockers = 0;

    int iterations = clamp(numSamples, 1, POISSON_MAX);
    for (int i = 0; i < iterations; i++)
    {
        vec2 o = rot * poisson[i];
        vec3 offsetDir = normalize(lightDir 
            + T * o.x * searchAngle
            + B * o.y * searchAngle);

        float sampleDepthNormalized = textureCube(shadowCube, offsetDir).r;

        if (sampleDepthNormalized < receiverDepthNormalized - shadowBias)
        {
            float blockerDepth = sampleDepthNormalized * (shadowFar - shadowNear) + shadowNear;
            blockerDepthSum += blockerDepth;
            numBlockers++;
        }
    }

    return (numBlockers > 0) ? (blockerDepthSum / float(numBlockers)) : -1.0;
}

float getFilterRadius(float avgBlockerDepth, float receiverDist, float lightRadius)
{
    float w_penumbra = (receiverDist - avgBlockerDepth) * lightRadius / (avgBlockerDepth + 1e-5);
    return max(w_penumbra, 0.0);
}

float shadowFactorPCSS(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos,
    float lightRadius,
    int blockerSamples,
    int pcfSamples
)
{
    // Step 1: Get average blocker depth
    float avgBlockerDepth = getAvgBlockerDepth(shadowCube, lightPos, shadowNear, shadowFar, 
        shadowBias, worldPos, lightRadius, blockerSamples);
    if (avgBlockerDepth < 0.0) return 1.0; // No blockers, fully lit
            
    // Step 2: Estimate filter radius from avg blocker depth
    float filterRadius = getFilterRadius(avgBlockerDepth, length(worldPos - lightPos), lightRadius);

    // Step 3: PCF with calculated filter radius
    return shadowFactorPCF(shadowCube, lightPos, shadowNear, shadowFar, 
        shadowBias, worldPos, filterRadius, pcfSamples);
}
```

</details>

<details markdown="1">
<summary>Directional Light PCSS</summary>

```glsl
float getAvgBlockerDepth01Directional(
    sampler2D shadowMap,
    vec2 uv,
    float receiverDepth01,
    float shadowBias01,
    float searchWidthUV,
    vec3 worldPos,
    int numSamples
)
{
    // Random rotation
    float rand = hash13(worldPos);
    float cs = cos(6.2831853 * rand);
    float sn = sin(6.2831853 * rand);
    mat2 rot = mat2(cs, -sn, sn, cs);

    float sum01 = 0.0;
    int blockers = 0;

    int iters = clamp(numSamples, 1, POISSON_MAX);
    for (int i = 0; i < iters; i++)
    {
        vec2 offset = rot * poisson[i] * searchWidthUV;
        float sampleDepth01 = texture(shadowMap, uv + offset).r;

        // only average actual blockers
        if (sampleDepth01 < receiverDepth01 - shadowBias01)
        {
            sum01 += sampleDepth01;
            blockers++;
        }
    }

    return (blockers > 0) ? (sum01 / float(blockers)) : -1.0;
}

float shadowFactorPCSSDirectional(
    sampler2D shadowMap,
    mat4 lightSpaceMatrix,
    float shadowBias01,
    vec3 worldPos,
    float lightRadiusWorld,   // emitter radius in world units 
    float frustumWidthWorld,  // (orthoR - orthoL) in world units
    int blockerSamples,
    int pcfSamples,
    float searchMultiplier    // k
)
{
    vec4 posLS = lightSpaceMatrix * vec4(worldPos, 1.0);
    vec3 proj = posLS.xyz / posLS.w;
    proj = proj * 0.5 + 0.5;

    // reject outside shadow map
    if (proj.z < 0.0 || proj.z > 1.0) return 1.0;
    if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0) return 1.0;

    float receiverDepth01 = proj.z;
    vec2 uv = proj.xy;

    // w_light^uv
    float lightSizeUV = lightRadiusWorld / max(frustumWidthWorld, 1e-6);

    // s = k * w_light^uv
    float searchWidthUV = searchMultiplier * lightSizeUV;

    // Step 1: avg blocker depth in depth01 space
    float avgBlocker01 = getAvgBlockerDepth01Directional(
        shadowMap, uv, receiverDepth01, shadowBias01,
        searchWidthUV, worldPos, blockerSamples
    );

    if (avgBlocker01 < 0.0) return 1.0;

    // Step 2: penumbra in UV 
    float penumbraUV = (receiverDepth01 - avgBlocker01) * lightSizeUV / max(avgBlocker01, 1e-6);
    float filterRadiusUV = max(penumbraUV, 0.0);

    // Step 3: PCF with radius = w_penumbra^uv
    return shadowFactorPCF(
        shadowMap, lightSpaceMatrix, shadowBias01,
        worldPos, filterRadiusUV, pcfSamples
    );
}

```

</details>





