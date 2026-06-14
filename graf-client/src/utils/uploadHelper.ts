import { storage } from './firebase';

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`${path}/${Date.now()}-${file.name}`);
    await fileRef.put(file);
    const url = await fileRef.getDownloadURL();
    return url;
  } catch {
    throw new Error('Error uploading file');
  }
};
