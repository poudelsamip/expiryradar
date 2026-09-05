import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddAttachmentTile, AttachmentThumbnail } from '@/components/AttachmentThumbnail';
import { Button } from '@/components/Button';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { pickAttachmentImage } from '@/lib/attachments';
import { computeStatus, formatDaysLabel, STATUS_COLORS, STATUS_LABELS } from '@/lib/status';
import { useItemsStore } from '@/store/useItemsStore';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const items = useItemsStore((s) => s.items);
  const remindersByItemId = useItemsStore((s) => s.remindersByItemId);
  const attachmentsByItemId = useItemsStore((s) => s.attachmentsByItemId);
  const archiveItem = useItemsStore((s) => s.archiveItem);
  const deleteItem = useItemsStore((s) => s.deleteItem);
  const addAttachment = useItemsStore((s) => s.addAttachment);
  const deleteAttachment = useItemsStore((s) => s.deleteAttachment);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const item = useMemo(() => items.find((it) => it.id === id), [items, id]);
  const reminders = id ? remindersByItemId[id] ?? [] : [];
  const attachments = id ? attachmentsByItemId[id] ?? [] : [];

  if (!item) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="font-sans-semibold text-base text-ink-500">Item not found.</Text>
        <Button title="Go back" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const category = CATEGORIES[item.category];
  const status = computeStatus(item.key_date);
  const statusColor = STATUS_COLORS[status];

  const handleResolve = () => {
    Alert.alert(`${category.actionLabel}?`, `This will archive "${item.name}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: category.actionLabel,
        onPress: () => {
          archiveItem(item.id, user?.id ?? null);
          router.back();
        },
      },
    ]);
  };

  const handleAddPhoto = async () => {
    const uri = await pickAttachmentImage();
    if (!uri) return;
    setIsUploadingPhoto(true);
    await addAttachment(item.id, uri, user?.id ?? null);
    setIsUploadingPhoto(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete item?', `This permanently removes "${item.name}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteItem(item.id, user?.id ?? null);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-50"
        >
          <Ionicons name="chevron-back" size={20} color="#1e293b" />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/add-item?id=${item.id}`)}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-50"
        >
          <Ionicons name="pencil" size={16} color="#1e293b" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="items-center">
          <View
            className="h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${category.color}1a` }}
          >
            <Ionicons name={category.icon} size={30} color={category.color} />
          </View>
          <Text className="mt-3 font-sans-extrabold text-xl text-ink-900">{item.name}</Text>
          <Text className="mt-1 font-sans-medium text-sm text-ink-500">{category.label}</Text>
        </View>

        <View className="mt-6 items-center rounded-2xl bg-ink-50 py-5">
          <Text className="font-sans-bold text-3xl" style={{ color: statusColor }}>
            {formatDaysLabel(item.key_date)}
          </Text>
          <Text className="mt-1 font-sans-semibold text-xs text-ink-500">
            {STATUS_LABELS[status]} · {item.key_date}
          </Text>
        </View>

        {item.quantity ? (
          <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-ink-100 px-4 py-3">
            <Text className="font-sans-medium text-sm text-ink-500">Quantity</Text>
            <Text className="font-sans-semibold text-sm text-ink-900">{item.quantity}</Text>
          </View>
        ) : null}

        {item.notes ? (
          <View className="mt-4 rounded-2xl border border-ink-100 px-4 py-3">
            <Text className="mb-1 font-sans-medium text-xs text-ink-500">Notes</Text>
            <Text className="font-sans-medium text-sm text-ink-800">{item.notes}</Text>
          </View>
        ) : null}

        <View className="mt-4">
          <Text className="mb-2 font-sans-semibold text-sm text-ink-700">Photos</Text>
          <View className="flex-row flex-wrap gap-3">
            {attachments.map((attachment) => (
              <AttachmentThumbnail
                key={attachment.id}
                attachment={attachment}
                onRemove={() => deleteAttachment(attachment.id, item.id, user?.id ?? null)}
              />
            ))}
            <AddAttachmentTile onPress={handleAddPhoto} />
          </View>
          {isUploadingPhoto ? (
            <Text className="mt-2 font-sans-medium text-xs text-ink-400">Uploading…</Text>
          ) : null}
        </View>

        <View className="mt-4">
          <Text className="mb-2 font-sans-semibold text-sm text-ink-700">Reminder schedule</Text>
          <View className="flex-row flex-wrap gap-2">
            {reminders.length === 0 ? (
              <Text className="font-sans-medium text-sm text-ink-400">No reminders set.</Text>
            ) : (
              reminders
                .slice()
                .sort((a, b) => b.offset_days - a.offset_days)
                .map((r) => (
                  <View key={r.id} className="rounded-full bg-brand-50 px-3 py-1.5">
                    <Text className="font-sans-semibold text-xs text-brand-700">
                      {r.offset_days === 0 ? 'On the day' : `${r.offset_days}d before`}
                    </Text>
                  </View>
                ))
            )}
          </View>
        </View>

        <View className="mt-8 gap-3">
          <Button title={category.actionLabel} onPress={handleResolve} />
          <Button title="Delete" variant="secondary" onPress={handleDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
