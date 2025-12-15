const LUT = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 25, 35, 47, 57, 66, 75, 85, 93, 99, 106, 113, 119, 126, 130, 136, 141, 145, 150, 154, 158, 161, 164, 168, 171, 174, 177, 179, 182, 184, 186, 188, 191, 193, 194, 196, 198, 200, 201, 202, 203, 204, 207, 208, 209, 210, 211, 211, 212, 214, 215, 216, 217, 217, 218, 219, 219, 220, 220, 222, 223, 223, 224, 224, 225, 225, 226, 226, 227, 227, 228, 228, 228, 230, 230, 230, 231, 231, 231, 232, 232, 232, 233, 233, 233, 234, 234, 234, 234, 235, 235, 235, 235, 236, 236, 236, 236, 236, 238, 238, 238, 238, 238, 239, 239, 239, 239, 239, 240, 240, 240, 240, 240, 240, 240, 241, 241, 241, 241, 241, 241, 241, 242, 242, 242, 242, 242, 242, 242, 242, 243, 243, 243, 243, 243, 243, 243, 243, 243, 244, 244, 244, 244, 244, 244, 244, 244, 244, 244, 244, 244, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246, 246, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 247, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 248, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249, 249]);
const INVERSE_LUT = new Uint8Array([32, 32, 32, 32, 32, 32, 32, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 38, 38, 38, 38, 38, 38, 38, 38, 38, 39, 39, 39, 39, 39, 39, 39, 39, 39, 40, 40, 40, 40, 40, 40, 40, 40, 40, 41, 41, 41, 41, 41, 41, 41, 42, 42, 42, 42, 42, 42, 42, 43, 43, 43, 43, 43, 43, 43, 44, 44, 44, 44, 44, 44, 45, 45, 45, 45, 45, 45, 45, 46, 46, 46, 46, 46, 47, 47, 47, 47, 47, 48, 48, 48, 48, 48, 48, 49, 49, 49, 49, 50, 50, 50, 50, 50, 51, 51, 51, 51, 52, 52, 52, 52, 53, 53, 53, 53, 54, 54, 54, 55, 55, 55, 56, 56, 56, 56, 57, 57, 57, 58, 58, 58, 59, 59, 60, 60, 60, 61, 61, 62, 62, 63, 63, 64, 64, 64, 65, 65, 66, 66, 67, 68, 68, 69, 69, 70, 70, 71, 72, 73, 74, 74, 75, 75, 76, 77, 78, 80, 81, 82, 82, 83, 84, 86, 87, 89, 91, 92, 92, 94, 96, 98, 100, 102, 105, 107, 108, 111, 114, 117, 121, 125, 130, 133, 135, 140, 147, 154, 162, 171, 183, 190, 196, 212, 232, 255, 255, 255, 255, 255, 255, 255]);

export const convertAdditiveImage = (img: HTMLImageElement | HTMLCanvasElement) => {
  // 画像の黒い部分を透過
  const { width, height } = img;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const { data } = imgData;

  for (let i = 0; i < data.length; i += 4) {
    const r = LUT[data[i]!]!;
    const g = LUT[data[i + 1]!]!;
    const b = LUT[data[i + 2]!]!;
    const a = data[i + 3]!;

    const brightness = Math.max(r, g, b) / 255;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a * brightness;
  }

  ctx.putImageData(imgData, 0, 0);

  return canvas;
};

export const adjustAdditiveImage = (img: HTMLImageElement) => {
  // 画像のRGB成分を LUT の逆変換
  const { width, height } = img;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const { data } = imgData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const brightness = 1;// Math.max(r, g, b) / 255;

    data[i] = INVERSE_LUT[r]! / brightness;
    data[i + 1] = INVERSE_LUT[g]! / brightness;
    data[i + 2] = INVERSE_LUT[b]! / brightness;
  }

  ctx.putImageData(imgData, 0, 0);

  return canvas;
};
