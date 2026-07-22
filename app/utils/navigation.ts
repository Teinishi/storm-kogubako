import TrainDoorIcon from '~/components/icons/TrainDoorIcon.vue';

export interface ToolData {
  key: string;
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  tags: string[];
  isBeta?: boolean;
}

export const WEB_TOOLS: ToolData[] = [
  {
    key: 'img2paint',
    to: '/img2paint',
    icon: 'i-lucide-image',
    tags: ['vanilla', 'vehicle'],
  },
  {
    key: 'mesh_viewer',
    to: '/mesh-viewer',
    icon: 'i-lucide-box',
    tags: ['mod', 'development'],
  },
  {
    key: 'custom_train_door',
    to: '/custom-train-door',
    icon: TrainDoorIcon,
    tags: ['mod', 'vehicle'],
    isBeta: true,
  },
] as const;

export const OTHER_TOOLS: ToolData[] = [
  {
    key: 'blender_mesh_io',
    to: 'https://github.com/Teinishi/blender_stormworks_mesh',
    icon: 'i-simple-icons-blender',
    tags: ['mod', 'development'],
  },
] as const;
