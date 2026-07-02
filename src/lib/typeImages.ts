import type { NilongType } from '../data/types';

export function getTypeImages(type: NilongType): readonly string[] {
  return 'imageVariants' in type && Array.isArray(type.imageVariants) && type.imageVariants.length > 0
    ? type.imageVariants
    : [type.image];
}

export function pickTypeImage(type: NilongType): string {
  const images = getTypeImages(type);
  if (images.length === 1) return images[0];
  return images[Math.floor(Math.random() * images.length)];
}
