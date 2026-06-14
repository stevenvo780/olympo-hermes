import { storage } from './firebase';

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`${path}/${Date.now()}-${file.name}`);
    await fileRef.put(file);
    const url = await fileRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
