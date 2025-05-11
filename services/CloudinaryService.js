// services/CloudinaryService.js
import * as FileSystem from 'expo-file-system';
import { getAuth } from 'firebase/auth';

const CLOUDINARY_URL = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

class CloudinaryService {
  getCurrentUserId() {
    const auth = getAuth();
    return auth.currentUser?.uid;
  }

  async uploadDocument(fileUri, todoId) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId || !todoId) {
        throw new Error('User not authenticated or missing todoId');
      }

      const base64File = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const publicId = `todo_docs/${userId}/${todoId}`;
      const formData = new FormData();
      formData.append('file', `data:application/pdf;base64,${base64File}`);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('public_id', publicId);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const responseData = await response.json();
      return {
        url: responseData.secure_url,
        publicId: responseData.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }
}

export default new CloudinaryService();