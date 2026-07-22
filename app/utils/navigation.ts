import TrainDoorIcon from '~/components/icons/TrainDoorIcon.vue';

export const WEB_TOOLS = [
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
  },
];

export const OTHER_TOOLS = [
  {
    key: 'blender_mesh_io',
    to: 'https://github.com/Teinishi/blender_stormworks_mesh',
    icon: 'i-simple-icons-blender',
    tags: ['mod', 'development'],
  },
];
