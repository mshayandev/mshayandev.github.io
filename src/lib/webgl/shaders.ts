/** Shared morph maths — keeps points and lines perfectly in sync. */
const MORPH_CHUNK = /* glsl */ `
  uniform float uStage;      // 0 = board, 1 = mesh, 2 = dashboard
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uPointerPower;

  float ease(float t) { return t * t * (3.0 - 2.0 * t); }

  vec3 morphPosition(vec3 p0, vec3 p1, vec3 p2, vec3 seed, out float transit, out float lift) {
    float s01 = ease(clamp(uStage, 0.0, 1.0));
    float s12 = ease(clamp(uStage - 1.0, 0.0, 1.0));
    vec3 p = mix(mix(p0, p1, s01), p2, s12);

    // Arc outward mid-transition so points travel rather than teleport.
    transit = max(s01 * (1.0 - s01), s12 * (1.0 - s12)) * 4.0;
    p += (seed - 0.5) * transit * 2.4;

    float drift = 0.05 + 0.14 * s01 * (1.0 - s12);
    p.x += sin(uTime * 0.33 + seed.x * 21.0) * drift;
    p.y += cos(uTime * 0.29 + seed.y * 18.0) * drift;
    p.z += sin(uTime * 0.24 + seed.z * 15.0) * drift * 1.6;

    float d = distance(p.xy, uPointer);
    lift = exp(-d * d * 0.05) * uPointerPower;
    p.z += lift * 1.8;
    p.xy += normalize(p.xy - uPointer + vec2(1e-4)) * lift * 0.55;

    return p;
  }

  vec3 stageWeights() {
    float w0 = 1.0 - clamp(uStage, 0.0, 1.0);
    float w2 = clamp(uStage - 1.0, 0.0, 1.0);
    return vec3(w0, max(0.0, 1.0 - w0 - w2), w2);
  }

  float travellingPulse(float t, float speed, float width) {
    float f = fract(t - uTime * speed);
    return smoothstep(0.0, width * 0.3, f) * (1.0 - smoothstep(width * 0.3, width, f));
  }
`;

export const pointVertex = /* glsl */ `
  ${MORPH_CHUNK}

  uniform float uPixelRatio;
  uniform float uScale;

  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aRand;
  attribute vec2 aMeta;   // x = flow along trace, y = base size

  varying float vPulse;
  varying float vTint;
  varying float vFade;

  void main() {
    float transit;
    float lift;
    vec3 p = morphPosition(position, aPos1, aPos2, aRand, transit, lift);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vec3 w = stageWeights();
    float boardPulse = travellingPulse(aMeta.x, 0.13, 0.18);
    float meshPulse  = travellingPulse(aRand.z * 2.0, 0.22, 0.5);
    float uiPulse    = 0.18 + 0.26 * sin(uTime * 1.1 + aRand.x * 14.0);

    vPulse = w.x * boardPulse + w.y * meshPulse + w.z * uiPulse + lift * 0.9;
    vTint  = clamp(uStage * 0.5, 0.0, 1.0);
    vFade  = 1.0 - transit * 0.3;

    float size = aMeta.y * (1.0 + vPulse * 1.5) * uScale;
    gl_PointSize = size * uPixelRatio * (250.0 / max(0.001, -mv.z));
  }
`;

export const pointFragment = /* glsl */ `
  precision mediump float;

  uniform vec3  uColorA;   // link blue
  uniform vec3  uColorB;   // signal teal
  uniform float uOpacity;

  varying float vPulse;
  varying float vTint;
  varying float vFade;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r2 = dot(c, c);
    if (r2 > 0.25) discard;

    float alpha = smoothstep(0.25, 0.0, r2);
    alpha *= alpha;

    vec3 col = mix(uColorB, uColorA, vTint);
    col = mix(col, vec3(0.90, 0.96, 1.0), clamp(vPulse, 0.0, 1.0) * 0.8);

    gl_FragColor = vec4(col, alpha * uOpacity * vFade * (0.30 + vPulse * 0.95));
  }
`;

export const lineVertex = /* glsl */ `
  ${MORPH_CHUNK}

  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aFlow;   // flow per stage
  attribute vec3 aRand;

  varying float vPulse;
  varying float vTint;
  varying float vFade;

  void main() {
    float transit;
    float lift;
    vec3 p = morphPosition(position, aPos1, aPos2, aRand, transit, lift);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vec3 w = stageWeights();
    float flow = dot(w, aFlow);
    float pulse = w.x * travellingPulse(flow, 0.13, 0.2)
                + w.y * travellingPulse(flow, 0.3, 0.35)
                + w.z * travellingPulse(flow, 0.09, 0.6);

    vPulse = pulse + lift * 0.7;
    vTint  = clamp(uStage * 0.5, 0.0, 1.0);
    vFade  = 1.0 - transit * 0.75;
  }
`;

export const lineFragment = /* glsl */ `
  precision mediump float;

  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uOpacity;

  varying float vPulse;
  varying float vTint;
  varying float vFade;

  void main() {
    vec3 col = mix(uColorB, uColorA, vTint);
    col = mix(col, vec3(0.85, 0.95, 1.0), clamp(vPulse, 0.0, 1.0) * 0.9);
    gl_FragColor = vec4(col, uOpacity * vFade * (0.10 + vPulse * 0.85));
  }
`;
