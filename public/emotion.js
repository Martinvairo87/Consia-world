export function emotionFromLandmarks(lm){
  // índices FaceMesh útiles:
  // boca: 13 (upper lip), 14 (lower lip), 61/291 (mouth corners)
  // cejas aprox: 70/300
  // ojos: 33/263 + 159/386
  const up = lm[13], lo = lm[14];
  const ml = lm[61], mr = lm[291];

  const mouthOpen = clamp((lo.y - up.y) * 18);
  const mouthWide = clamp((mr.x - ml.x) * 8);

  // heurística simple
  let label = "neutral";

  if(mouthOpen > 0.55) label = "surprised";
  else if(mouthWide > 0.75 && mouthOpen > 0.12) label = "happy";
  else if(mouthWide < 0.55 && mouthOpen < 0.10) label = "focused";

  return { label, mouthOpen, mouthWide };
}

function clamp(x){
  return Math.max(0, Math.min(1, x));
}
