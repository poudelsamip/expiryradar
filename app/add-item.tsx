import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddAttachmentTile, AttachmentThumbnail } from '@/components/AttachmentThumbnail';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { CATEGORIES, CATEGORY_LIST } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { pickAttachmentImage } from '@/lib/attachments';
import { itemSchema, type ItemFormData } from '@/lib/validation';
import { useItemsStore } from '@/store/useItemsStore';
import type { CategoryKey } from '@/types/item';

export default function AddItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const items = useItemsStore((s) => s.items);
  const attachmentsByItemId = useItemsStore((s) => s.attachmentsByItemId);
  const addItem = useItemsStore((s) => s.addItem);
  const updateItem = useItemsStore((s) => s.updateItem);
  const addAttachment = useItemsStore((s) => s.addAttachment);
  const deleteAttachment = useItemsStore((s) => s.deleteAttachment);

  const editingItem = useMemo(() => items.find((it) => it.id === id), [items, id]);
  const isEditing = Boolean(editingItem);
  const existingAttachment = editingItem ? attachmentsByItemId[editingItem.id]?.[0] : undefined;

  const [category, setCategory] = useState<CategoryKey | null>(editingItem?.category ?? null);
  const [step, setStep] = useState<'category' | 'form'>(isEditing ? 'form' : 'category');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

  const onPickPhoto = async () => {
    const uri = await pickAttachmentImage();
    if (uri) {
      setPickedPhotoUri(uri);
      setRemoveExistingPhoto(false);
    }
  };

  const { control, handleSubmit } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: editingItem?.name ?? '',
      key_date: editingItem?.key_date ?? '',
      notes: editingItem?.notes ?? '',
      quantity: editingItem?.quantity ? String(editingItem.quantity) : '',
    },
  });

  const selectedCategoryConfig = category ? CATEGORIES[category] : null;

  const onSelectCategory = (key: CategoryKey) => {
    setCategory(key);
    setStep('form');
  };

  const onSubmit = async (data: ItemFormData) => {
    if (!category) return;
    setServerError(null);
    setIsSaving(true);

    const input = {
      name: data.name.trim(),
      category,
      key_date: data.key_date,
      notes: data.notes?.trim() || null,
      quantity: category === 'food' && data.quantity ? Number(data.quantity) : null,
    };

    let itemId: string | undefined;

    if (isEditing && editingItem) {
      const result = await updateItem(editingItem.id, input, user?.id ?? null);
      if (result.error) {
        setIsSaving(false);
        setServerError(result.error);
        return;
      }
      itemId = editingItem.id;
    } else {
      const result = await addItem(input, user?.id ?? null);
      if (result.error) {
        setIsSaving(false);
        setServerError(result.error);
        return;
      }
      itemId = result.id;
    }

    if (itemId) {
      if (removeExistingPhoto && existingAttachment) {
        await deleteAttachment(existingAttachment.id, itemId, user?.id ?? null);
      }
      if (pickedPhotoUri) {
        await addAttachment(itemId, pickedPhotoUri, user?.id ?? null);
      }
    }

    setIsSaving(false);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pt-2">
        <Pressable
          onPress={() => (step === 'form' && !isEditing ? setStep('category') : router.back())}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-50"
        >
          <Ionicons name="chevron-back" size={20} color="#1e293b" />
        </Pressable>
        <Text className="ml-3 font-sans-bold text-lg text-ink-900">
          {isEditing ? 'Edit item' : step === 'category' ? 'Choose a category' : 'Add item'}
        </Text>
      </View>

      {step === 'category' ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="flex-row flex-wrap gap-3">
            {CATEGORY_LIST.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => onSelectCategory(c.key)}
                className="w-[47%] items-center rounded-2xl border border-ink-100 bg-ink-50 py-5 active:opacity-70"
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${c.color}1a` }}
                >
                  <Ionicons name={c.icon} size={22} color={c.color} />
                </View>
                <Text className="mt-2 text-center font-sans-semibold text-sm text-ink-800">
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {selectedCategoryConfig ? (
            <View className="mb-5 flex-row items-center rounded-2xl bg-ink-50 px-4 py-3">
              <Ionicons name={selectedCategoryConfig.icon} size={18} color={selectedCategoryConfig.color} />
              <Text className="ml-2 font-sans-semibold text-sm text-ink-700">
                {selectedCategoryConfig.label}
              </Text>
              <Text className="ml-auto font-sans-medium text-xs text-ink-500">
                Reminds you {selectedCategoryConfig.defaultReminderOffsets.join('/')}d before
              </Text>
            </View>
          ) : null}

          <FormField control={control} name="name" label="Name" placeholder="e.g. Passport" />
          <DateField control={control} name="key_date" label="Key date" />
          {category === 'food' ? (
            <FormField
              control={control}
              name="quantity"
              label="Quantity (optional)"
              placeholder="e.g. 2"
              keyboardType="number-pad"
            />
          ) : null}
          <FormField
            control={control}
            name="notes"
            label="Notes (optional)"
            placeholder="Anything worth remembering"
            multiline
            numberOfLines={3}
          />

          <View className="mb-5">
            <Text className="mb-1.5 font-sans-semibold text-sm text-ink-700">Photo (optional)</Text>
            <View className="flex-row gap-3">
              {pickedPhotoUri ? (
                <View>
                  <Text className="mb-1 font-sans-medium text-[10px] text-ink-400">New photo</Text>
                  <AttachmentThumbnail
                    attachment={{
                      id: 'pending',
                      item_id: '',
                      file_url: pickedPhotoUri,
                      file_type: 'image',
                      created_at: '',
                    }}
                    onRemove={() => setPickedPhotoUri(null)}
                  />
                </View>
              ) : existingAttachment && !removeExistingPhoto ? (
                <AttachmentThumbnail
                  attachment={existingAttachment}
                  onRemove={() => setRemoveExistingPhoto(true)}
                />
              ) : null}
              <AddAttachmentTile onPress={onPickPhoto} />
            </View>
          </View>

          {serverError ? (
            <Text className="mb-3 font-sans-medium text-sm text-red-500">{serverError}</Text>
          ) : null}

          <Button
            title={isEditing ? 'Save changes' : 'Add item'}
            isLoading={isSaving}
            onPress={handleSubmit(onSubmit)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
