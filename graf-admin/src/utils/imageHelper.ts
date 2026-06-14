const DEFAULT_IMAGE = '/images/no-image.png';

export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return DEFAULT_IMAGE;
  const trimmed = url.trim();
  return trimmed || DEFAULT_IMAGE;
};

export const extractFirstValidImageUrl = (images: string | string[] | undefined | null): string => {
  if (!images) return DEFAULT_IMAGE;
  
  if (typeof images === 'string') {
    return getValidImageUrl(images);
  }
  
  if (Array.isArray(images)) {
    for (const url of images) {
      const validUrl = getValidImageUrl(url);
      if (validUrl !== DEFAULT_IMAGE) {
        return validUrl;
      }
    }
  }
  
  return DEFAULT_IMAGE;
};

export const validateFirebaseUrl = getValidImageUrl;
export const extractImageUrl = extractFirstValidImageUrl;
