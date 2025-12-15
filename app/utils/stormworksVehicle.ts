import { colorEquals } from '~/utils/utils';

const vehicleXmlColor = ({ r, g, b }: Color3, omitBlack: boolean) => {
  if (omitBlack && r === 0 && g === 0 && b === 0) {
    // 黒
    return '';
  }
  else if (r === 255 && g === 255 && b === 255) {
    // 白
    return 'x';
  }
  else {
    return (r << 16 | g << 8 | b).toString(16);
  }
};

const vehicleXmlVp = ({ x, y, z }: Position3, tagName?: string) => {
  if (x === 0 && y === 0 && z === 0) return '';
  let xml = `<${tagName ?? 'vp'}`;
  if (x !== 0) {
    xml += ` x="${x}"`;
  }
  if (y !== 0) {
    xml += ` y="${y}"`;
  }
  if (z !== 0) {
    xml += ` z="${z}"`;
  }
  xml += '/>';
  return xml;
};

export type PaintableSignConfig = Partial<{
  minimizeSigns: boolean; // 単色部分は通常ブロックにする
  minimizeIndicators: boolean; // 発光しない部分は Indicator にしない
  logicLinks: boolean;
  electricLinks: boolean;
}>;

export const generatePaintableSignVehicle = (width: number, height: number, baseImage: ImageDataArray, glowImage?: ImageDataArray, config?: PaintableSignConfig) => {
  const widthBlocks = Math.ceil(width / 9);
  const heightBlocks = Math.ceil(height / 9);
  const blockOffsetX = Math.floor(-widthBlocks / 2);
  const blockOffsetZ = Math.floor(heightBlocks / 2);

  let xml = '<?xml version="1.0" encoding="UTF-8"?><vehicle data_version="3" bodies_id="1"><authors/><bodies><body unique_id="1"><components>';

  const indicatorPositions: Position3[] = [];

  for (let i = 0; i < heightBlocks; i++) {
    for (let j = 0; j < widthBlocks; j++) {
      // 属性
      const gc: string[] = [];
      const gca: string[] = [];

      // 単色判定
      let baseColor: { r: number; g: number; b: number } | undefined;
      let isSingleColor = true;

      // 発光有無
      let hasNoGlow = true;

      for (let y = 9 * i + 8; y >= 9 * i; y--) {
        for (let x = 9 * j; x < 9 * j + 9; x++) {
          const color = getPixel(x, y, width, height, baseImage) || WHITE;
          gc.push(vehicleXmlColor(color, true));

          if (!baseColor) {
            // ブロックの最初のピクセルなら色を記憶
            baseColor = color;
          }
          else if (isSingleColor) {
            // 単色判定
            isSingleColor &&= colorEquals(baseColor, color);
          }

          // 発光
          if (!glowImage) continue;
          const glowColor = getPixel(x, y, width, height, glowImage) || BLACK;
          gca.push(vehicleXmlColor(glowColor, false));
          hasNoGlow &&= colorEquals(glowColor, BLACK);
        }
      }

      const pos = { x: blockOffsetX + j, y: 0, z: blockOffsetZ - i };
      const xmlVp = vehicleXmlVp(pos);
      if (config?.minimizeSigns && hasNoGlow && isSingleColor) {
        // Block を使用
        const colorStr = vehicleXmlColor(baseColor!, true);
        const sc = colorStr === 'x' ? '6' : `6,x,x,${colorStr},x,x,x`;
        if (xmlVp.length === 0) {
          xml += `<c><o r="1,0,0,0,1,0,0,0,1" sc="${sc}"/></c>`;
        }
        else {
          xml += `<c><o r="1,0,0,0,1,0,0,0,1" sc="${sc}">${xmlVp}</o></c>`;
        }
      }
      else if (config?.minimizeIndicators && hasNoGlow) {
        // Paintable Sign を使用
        xml += `<c d="sign_na"><o r="1,0,0,0,1,0,0,0,1" sc="6" gc="${gc.join(',')}">${xmlVp}<logic_slots><slot/></logic_slots></o></c>`;
      }
      else {
        // Paintable Indicator を使用
        xml += `<c d="sign"><o r="1,0,0,0,1,0,0,0,1" sc="6" gc="${gc.join(',')}" gca="${gca.join(',')}">${xmlVp}<logic_slots><slot/></logic_slots></o></c>`;
        indicatorPositions.push(pos);
      }
    }
  }

  const logic_links: {
    type: number;
    pos0: Position3;
    pos1: Position3;
  }[] = [];

  if (config?.logicLinks) {
    // バッファマイコン
    const bufferPos = { x: blockOffsetX - 1, y: 0, z: blockOffsetZ };
    const bufferVp = vehicleXmlVp({ x: bufferPos.x, y: bufferPos.y, z: bufferPos.z - 1 });
    xml += `<c d="microprocessor"><o r="1,0,0,0,1,0,0,0,1" sc="10"><microprocessor_definition name="On/Off Buffer" width="1" length="2" id_counter="3" id_counter_node="2"><nodes><n id="1" component_id="1"><node label="Input" mode="1"/></n><n id="2" component_id="3"><node label="Output"><position z="1"/></node></n></nodes><group><data><inputs/><outputs/></data><components/><components_bridge><c><object id="1"/></c><c type="1"><object id="3"><pos x="1.25"/><in1 component_id="1"/></object></c></components_bridge><groups/></group></microprocessor_definition>${bufferVp}<logic_slots><slot/><slot/></logic_slots></o></c>`;

    // ロジック配線
    for (const pos of indicatorPositions) {
      logic_links.push({
        type: 0,
        pos0: bufferPos,
        pos1: pos,
      });
    }
  }

  // 電気配線
  if (config?.electricLinks) {
    const firstIndicatorPos = indicatorPositions.shift();
    if (firstIndicatorPos) {
      for (const pos of indicatorPositions) {
        logic_links.push({
          type: 4,
          pos0: firstIndicatorPos,
          pos1: pos,
        });
      }
    }
  }

  xml += '</components></body></bodies>';
  // 配線の XML 生成
  if (logic_links.length === 0) {
    xml += '<logic_node_links/>';
  }
  else {
    xml += '<logic_node_links>';
    for (const link of logic_links) {
      if (link.type === 0) {
        xml += '<logic_node_link>';
      }
      else {
        xml += `<logic_node_link type="${link.type}">`;
      }
      xml += vehicleXmlVp(link.pos0, 'voxel_pos_0');
      xml += vehicleXmlVp(link.pos1, 'voxel_pos_1');
      xml += '</logic_node_link>';
    }
    xml += '</logic_node_links>';
  }
  xml += '</vehicle>\n';

  return xml;
};

const getPixel = (x: number, y: number, width: number, height: number, image: ImageDataArray) => {
  if (x < 0 || width <= x || y < 0 || height <= y) {
    return null;
  }
  const i = (width * y + x) * 4;
  return {
    r: image[i]!,
    g: image[i + 1]!,
    b: image[i + 2]!,
    a: image[i + 3]!,
  };
};
