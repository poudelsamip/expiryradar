import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { generateId } from '@/lib/uuid';
import { supabase } from '@/lib/supabase';

const BUCKET = 'attachments';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

// Storage paths never start with a scheme, so this cheaply tells a stored
// path apart from a ready-to-use uri (local file://, data:, or http(s)).
export function isDisplayableUri(fileUrl: string): boolean {
  return /^[a-z]+:\/\//i.test(fileUrl) || fileUrl.startsWith('data:');
}

async function requestPickerPermission(kind: 'camera' | 'library'): Promise<boolean> {
  const { status } =
    kind === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

// Prompts the user to take a new photo or pick one from their library.
// Resolves to the picked image's local uri, or null if cancelled/denied.
export function pickAttachmentImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const launchLibrary = async () => {
      const granted = await requestPickerPermission('library');
      if (!granted) {
        Alert.alert('Permission needed', 'Allow photo library access to attach a picture.');
        resolve(null);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
      resolve(result.canceled ? null : (result.assets[0]?.uri ?? null));
    };

    const launchCamera = async () => {
      const granted = await requestPickerPermission('camera');
      if (!granted) {
        Alert.alert('Permission needed', 'Allow camera access to take a picture.');
        resolve(null);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
      resolve(result.canceled ? null : (result.assets[0]?.uri ?? null));
    };

    if (Platform.OS === 'web') {
      // No camera capture flow on web — go straight to the file picker.
      launchLibrary();
      return;
    }

    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: launchCamera },
      { text: 'Choose from library', onPress: launchLibrary },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

// Uploads a local image uri to Supabase Storage and returns the object path
// (not a URL — the bucket is private, so callers resolve a signed URL to display it).
export async function uploadAttachment(
  userId: string,
  itemId: string,
  localUri: string
): Promise<{ path: string | null; error: string | null }> {
  try {
    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();
    const path = `${userId}/${itemId}/${generateId()}.jpg`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: 'image/jpeg' });

    if (error) return { path: null, error: error.message };
    return { path, error: null };
  } catch {
    return { path: null, error: 'Could not upload photo.' };
  }
}

export async function getSignedAttachmentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteAttachmentFile(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
