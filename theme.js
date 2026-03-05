// Theme helpers. Uses global tinycolor from UMD.
const tcolor = window.tinycolor;

export function themeFrom(colorHex, accentHex) {
  const c = tcolor(colorHex);
  const a = tcolor(accentHex);
  const bg1 = c.clone().darken(28);
  const bg2 = c.clone().darken(36);
  const glow = a.clone().lighten(10);
  return {
    bg1: bg1.toHexString(),
    bg2: bg2.toHexString(),
    accent: a.toHexString(),
    glow: glow.toHexString(),
  };
}

export { tcolor as tinycolor };