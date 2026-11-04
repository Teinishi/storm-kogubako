import { serializeVehicleXml, type VehicleSchemas } from '@sw-file-lib/xml';

const R_IDENTITIY = '1,0,0,0,1,0,0,0,1' as const;

const BUFFER_MICROCONTROLLER: VehicleSchemas.MicroprocessorDefinition = {
  name: 'On/Off Buffer',
  width: 1,
  length: 2,
  id_counter: 3,
  id_counter_node: 2,
  nodes: [
    {
      id: 1,
      component_id: 1,
      node: {
        label: 'Input',
        mode: 1,
      },
    },
    {
      id: 2,
      component_id: 3,
      node: {
        label: 'Output',
        position: {
          z: 1,
        },
      },
    },
  ],
  group: {
    data: {
      inputs: {},
      outputs: {},
    },
    components: [],
    components_bridge: [
      {
        object: {
          id: 1,
        },
      },
      {
        type: 1,
        object: {
          id: 3,
          pos: {
            x: 1.25,
          },
          in1: {
            component_id: 1,
          },
        },
      },
    ],
    groups: {},
  },
} as const;

const vehicleXmlColor = ({ r, g, b }: Readonly<Color>, omitBlack: boolean) => {
  if (omitBlack && r === 0 && g === 0 && b === 0) {
    // 黒
    return '';
  } else if (r === 255 && g === 255 && b === 255) {
    // 白
    return 'x';
  } else {
    return ((r << 16) | (g << 8) | b).toString(16);
  }
};

export interface PaintableSignConfig {
  minimizeSigns?: boolean; // 単色部分は通常ブロックにする
  minimizeIndicators?: boolean; // 発光しない部分は Indicator にしない
  logicLinks?: boolean;
  electricLinks?: boolean;
}

export function generatePaintableSignVehicle(
  width: number,
  height: number,
  baseImage: DeepReadonly<ImageDataArray>,
  glowImage?: DeepReadonly<ImageDataArray>,
  config?: Readonly<PaintableSignConfig>,
) {
  const widthBlocks = Math.ceil(width / 9);
  const heightBlocks = Math.ceil(height / 9);
  const blockOffsetX = Math.floor(-widthBlocks / 2);
  const blockOffsetZ = Math.floor(heightBlocks / 2);

  const components: VehicleSchemas.Component[] = [];
  const indicatorPositions: Vec3[] = [];

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
          } else if (isSingleColor) {
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
      const vp = createXmlVec3({ x: blockOffsetX + j, y: 0, z: blockOffsetZ - i });
      if (config?.minimizeSigns && hasNoGlow && isSingleColor) {
        // Block を使用
        const colorStr = vehicleXmlColor(baseColor!, true);
        const sc = colorStr === 'x' ? '6' : `6,x,x,${colorStr},x,x,x`;
        components.push({
          o: {
            r: R_IDENTITIY,
            sc,
            vp,
          },
        });
      } else if (config?.minimizeIndicators && hasNoGlow) {
        // Paintable Sign を使用
        components.push({
          d: 'sign_na',
          o: {
            r: R_IDENTITIY,
            sc: '6',
            gc: gc.join(','),
            vp,
            logic_slots: [{}],
          },
        });
      } else {
        // Paintable Indicator を使用
        components.push({
          d: 'sign',
          o: {
            r: R_IDENTITIY,
            sc: '6',
            gc: gc.join(','),
            gca: gca.join(','),
            vp,
            logic_slots: [{}],
          },
        });
        indicatorPositions.push(pos);
      }
    }
  }

  const logicNodeLinks: VehicleSchemas.LogicNodeLink[] = [];

  if (config?.logicLinks) {
    // バッファマイコン
    const bufferPos = { x: blockOffsetX - 1, y: 0, z: blockOffsetZ };
    components.push({
      d: 'microprocessor',
      o: {
        r: R_IDENTITIY,
        sc: '10',
        microprocessor_definition: BUFFER_MICROCONTROLLER,
        vp: createXmlVec3({
          x: bufferPos.x,
          y: bufferPos.y,
          z: bufferPos.z - 1,
        }),
        logic_slots: [{}, {}],
      },
    });

    // ロジック配線
    for (const pos of indicatorPositions) {
      logicNodeLinks.push({
        voxel_pos_0: createXmlVec3(bufferPos),
        voxel_pos_1: createXmlVec3(pos),
      });
    }
  }

  // 電気配線
  if (config?.electricLinks) {
    const firstIndicatorPos = indicatorPositions.shift();
    if (firstIndicatorPos) {
      for (const pos of indicatorPositions) {
        logicNodeLinks.push({
          type: 4,
          voxel_pos_0: createXmlVec3(firstIndicatorPos),
          voxel_pos_1: createXmlVec3(pos),
        });
      }
    }
  }

  return serializeVehicleXml({
    data_version: 3,
    bodies_id: 1,
    authors: [],
    bodies: [
      {
        unique_id: 1,
        components,
      },
    ],
    logic_node_links: logicNodeLinks,
  });
}

function getPixel(
  x: number,
  y: number,
  width: number,
  height: number,
  image: DeepReadonly<ImageDataArray>,
) {
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
}
