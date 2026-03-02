import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../lib/firebase';

const storage = app ? getStorage(app) : null;

/**
 * Compress image before upload to reduce storage costs and improve performance
 */
async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

/**
 * Upload crop image to Firebase Storage
 * @param userId - User ID for folder organization
 * @param imageFile - Image file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Download URL of uploaded image
 */
export async function uploadCropImage(
    userId: string,
    imageFile: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    if (!storage) {
        throw new Error('Firebase Storage not configured');
    }

    try {
        // Compress image before upload
        const compressedBlob = await compressImage(imageFile);

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const filename = `${timestamp}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storagePath = `crops/${userId}/${filename}`;

        // Create storage reference
        const storageRef = ref(storage, storagePath);

        // Upload file
        if (onProgress) onProgress(50); // Simulated progress
        const snapshot = await uploadBytes(storageRef, compressedBlob, {
            contentType: 'image/jpeg',
        });

        if (onProgress) onProgress(90);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        if (onProgress) onProgress(100);

        console.log('Image uploaded successfully:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image. Please check your internet connection.');
    }
}

/**
 * Delete crop image from Firebase Storage
 * @param imageUrl - Full download URL of the image
 */
export async function deleteCropImage(imageUrl: string): Promise<void> {
    if (!storage) {
        throw new Error('Firebase Storage not configured');
    }

    try {
        // Extract path from URL
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);

        if (!pathMatch) {
            throw new Error('Invalid image URL');
        }

        const path = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, path);

        await deleteObject(storageRef);
        console.log('Image deleted successfully');
    } catch (error) {
        console.error('Error deleting image:', error);
        throw new Error('Failed to delete image');
    }
}

/**
 * Get download URL for a storage path
 * @param path - Storage path (e.g., 'crops/user123/image.jpg')
 * @returns Download URL
 */
export async function getImageUrl(path: string): Promise<string> {
    if (!storage) {
        throw new Error('Firebase Storage not configured');
    }

    try {
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error('Error getting image URL:', error);
        throw new Error('Failed to get image URL');
    }
}

/**
 * Convert blob URL to File object for upload
 * @param blobUrl - Blob URL from camera/file input
 * @param filename - Desired filename
 * @returns File object
 */
export async function blobUrlToFile(blobUrl: string, filename: string = 'crop_image.jpg'): Promise<File> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'image/jpeg' });
}
