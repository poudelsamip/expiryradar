import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  minimumDate?: Date;
};

function parseISODate(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date();
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string | undefined): string {
  if (!value) return 'Select a date';
  return parseISODate(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DateField<T extends FieldValues>({ control, name, label, minimumDate }: DateFieldProps<T>) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const currentDate = parseISODate(value as string);

        const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
          if (Platform.OS === 'android') setShowPicker(false);
          if (event.type === 'dismissed') return;
          if (selected) onChange(toISODate(selected));
        };

        return (
          <View className="mb-4">
            <Text className="mb-1.5 font-sans-semibold text-sm text-ink-700">{label}</Text>

            {Platform.OS === 'web' ? (
              <View
                className={`rounded-2xl border bg-ink-50 px-4 ${
                  error ? 'border-red-400' : 'border-ink-200'
                }`}
              >
                {/* react-native-web renders this as a real <input type="date"> */}
                <input
                  type="date"
                  value={(value as string) || ''}
                  onChange={(e) => onChange(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    padding: '14px 0',
                    fontSize: 16,
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setShowPicker(true)}
                className={`flex-row items-center justify-between rounded-2xl border bg-ink-50 px-4 py-3.5 ${
                  error ? 'border-red-400' : 'border-ink-200'
                }`}
              >
                <Text className={`font-sans-medium text-base ${value ? 'text-ink-900' : 'text-ink-400'}`}>
                  {formatDisplayDate(value as string)}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#94a3b8" />
              </Pressable>
            )}

            {error ? (
              <Text className="mt-1.5 font-sans-medium text-xs text-red-500">{error.message}</Text>
            ) : null}

            {showPicker && Platform.OS === 'android' ? (
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="default"
                minimumDate={minimumDate}
                onChange={handleChange}
              />
            ) : null}

            {Platform.OS === 'ios' ? (
              <Modal visible={showPicker} transparent animationType="slide">
                <Pressable
                  className="flex-1 justify-end bg-black/30"
                  onPress={() => setShowPicker(false)}
                >
                  <Pressable className="rounded-t-3xl bg-white pb-6 pt-2">
                    <View className="flex-row justify-end px-4 pb-2">
                      <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
                        <Text className="font-sans-bold text-sm text-brand-600">Done</Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={currentDate}
                      mode="date"
                      display="spinner"
                      minimumDate={minimumDate}
                      onChange={handleChange}
                    />
                  </Pressable>
                </Pressable>
              </Modal>
            ) : null}
          </View>
        );
      }}
    />
  );
}
