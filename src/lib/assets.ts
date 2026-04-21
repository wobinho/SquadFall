export type AssetType = 'characters' | 'gears' | 'skills';

export const getAssetPath = (filename: string, type: AssetType): string => {
  if (!filename) return '';
  return `/assets/${type}/${filename}.png`;
};

export const getCharacterAsset = (art: string): string => {
  return getAssetPath(art, 'characters');
};

export const getGearAsset = (art: string): string => {
  return getAssetPath(art, 'gears');
};

export const getSkillAsset = (art: string): string => {
  return getAssetPath(art, 'skills');
};
