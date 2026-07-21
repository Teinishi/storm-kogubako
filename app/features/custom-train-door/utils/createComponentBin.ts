export interface ComponentBinAsset {
  filename: string;
  data: string | Uint8Array;
}

export function createComponentBin(filename: string, definition: string, assets: DeepReadonly<ComponentBinAsset[]> = []) {
  const name = replaceExtension(filename, '');
  const binName = name + '.bin';

  const writer = new BinaryWriter();

  writer.withSize(4, (writer) => {
    writer.uint32(1); // バージョン

    writer.utf8(name, true); // 定義ファイル名
    writer.utf8(definition, true); // 定義XML

    writer.uint16(assets.length); // アセット数
    for (const asset of assets) {
      writer.utf8(asset.filename, true); // アセット名
      writer.withSize(4, (writer) => {
        if (typeof asset.data === 'string') {
          writer.utf8(asset.data, true);
        }
        else {
          writer.bytes(asset.data);
        }
      });
    }
  });

  return {
    name,
    file: {
      filename: binName,
      data: writer.toUint8Array(),
      mimetype: 'application/octet-stream',
    },
  };
}
