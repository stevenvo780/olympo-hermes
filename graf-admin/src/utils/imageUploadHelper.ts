import { storage } from './firebase';

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const fileName = `${path}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref();
    const fileRef = storageRef.child(fileName);
    await fileRef.put(file);
    const url = await fileRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadMultipleImages = async (files: File[], path: string): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadImage(file, path));
  return Promise.all(uploadPromises);
};
