export function getImageSize(img: HTMLImageElement | HTMLCanvasElement | null) {
  if (!img) return null;
  const { width, height } = img;
  return {
    width: width,
    height: height,
    aspect: width / height,
    isMultiplesOf9: width % 9 === 0 && height % 9 === 0,
  };
}
