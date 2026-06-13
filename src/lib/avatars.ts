import type { ImageSourcePropType } from 'react-native';

const AVATAR_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('../../assets/images/avatars/face_1.png'),
  2: require('../../assets/images/avatars/face_2.png'),
  3: require('../../assets/images/avatars/face_3.png'),
  4: require('../../assets/images/avatars/face_4.png'),
};

export const AVATAR_COUNT = 4;

export function pickRandomAvatarId(): number {
  return 1 + Math.floor(Math.random() * AVATAR_COUNT);
}

export function getAvatarSource(id: number | null | undefined): ImageSourcePropType | null {
  if (!id) return null;
  return AVATAR_IMAGES[id] ?? null;
}
