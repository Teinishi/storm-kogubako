export function replaceExtension(filename: string, ext: string) {
  ext = ext.startsWith('.') ? ext : `.${ext}`;
  return filename.replace(/\.[^/\\.]+$/, '') + ext;
}
