export type Rgb = [number, number, number];

// WCAG 2.x relative luminance of an sRGB colour with 8-bit channels
const luminance = ([red, green, blue]: Rgb) => {
  const linear = (channel: number) => {
    const unit = channel / 255;
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
};

export const contrastRatio = (a: Rgb, b: Rgb) => {
  const [lighter = 0, darker = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};
