import { serializeComponentMod } from '@sw-file-lib/core';

export interface ComponentBinAsset {
  filename: string;
  data: string | Uint8Array;
}

export function createComponentBin(
  filename: string,
  definition: string,
  assets: ComponentBinAsset[] = [],
) {
  const name = replaceExtension(filename, '');
  const binName = name + '.bin';

  const data = serializeComponentMod({
    name,
    definition,
    assets: assets.map((asset) => ({
      name: asset.filename,
      data: asset.data,
    })),
  });

  return {
    name,
    file: {
      filename: binName,
      data,
      mimetype: 'application/octet-stream',
    },
  };
}
