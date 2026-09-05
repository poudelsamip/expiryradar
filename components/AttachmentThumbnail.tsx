import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, View } from 'react-native';

import { getSignedAttachmentUrl, isDisplayableUri } from '@/lib/attachments';
import type { Attachment } from '@/types/item';

type AttachmentThumbnailProps = {
  attachment: Attachment;
  size?: number;
  onRemove?: () => void;
};

export function AttachmentThumbnail({ attachment, size = 72, onRemove }: AttachmentThumbnailProps) {
  const directUri = isDisplayableUri(attachment.file_url) ? attachment.file_url : null;
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const uri = directUri ?? signedUrl;

  useEffect(() => {
    if (directUri) return;
    let cancelled = false;
    getSignedAttachmentUrl(attachment.file_url).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment.file_url, directUri]);

  return (
    <>
      <Pressable
        onPress={() => uri && setPreviewOpen(true)}
        style={{ width: size, height: size }}
        className="items-center justify-center overflow-hidden rounded-xl bg-ink-100"
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
        ) : (
          <ActivityIndicator color="#94a3b8" />
        )}

        {onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60"
          >
            <Ionicons name="close" size={12} color="#fff" />
          </Pressable>
        ) : null}
      </Pressable>

      <Modal visible={previewOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreviewOpen(false)}
        >
          {uri ? (
            <Image source={{ uri }} style={{ width: '90%', height: '70%' }} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

export function AddAttachmentTile({ size = 72, onPress }: { size?: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50 active:opacity-70"
    >
      <View className="items-center">
        <Ionicons name="camera-outline" size={20} color="#64748b" />
      </View>
    </Pressable>
  );
}
