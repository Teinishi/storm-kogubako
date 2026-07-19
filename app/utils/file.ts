export function replaceExtension(filename: string, ext: string) {
  return filename.replace(/\.[^/\\.]+$/, '') + ext;
}
