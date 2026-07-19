export interface ComponentBinAsset {
  filename: string;
  data: string | Uint8Array;
}

export function createComponentBin(filename: string, definition: string, assets: DeepReadonly<ComponentBinAsset[]> = []) {
  const name = replaceExtension(filename, '');

  const writer = new BinaryWriter();

  const endFile = writer.startSized(4); // ファイルサイズ

  writer.uint32(1); // バージョン

  writer.utf8(name, true); // 定義ファイル名
  writer.utf8(definition, true); // 定義XML

  writer.uint16(assets.length); // アセット数
  for (const asset of assets) {
    writer.utf8(asset.filename, true); // アセット名
    const endAsset = writer.startSized(4); // アセットサイズ
    if (typeof asset.data === 'string') {
      writer.utf8(asset.data, true);
    }
    else {
      writer.bytes(asset.data);
    }
    endAsset();
  }

  endFile();

  return writer.toUint8Array();
}
