import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
} & TextInputProps;

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  icon,
  ...inputProps
}: FormFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="mb-4">
          <Text className="mb-1.5 font-sans-semibold text-sm text-ink-700">{label}</Text>
          <View
            className={`flex-row items-center rounded-2xl border bg-ink-50 px-4 ${
              error ? 'border-red-400' : isFocused ? 'border-brand-500 bg-white' : 'border-ink-200'
            }`}
          >
            {icon ? (
              <Ionicons
                name={icon}
                size={18}
                color={error ? '#f87171' : isFocused ? '#2563eb' : '#94a3b8'}
                style={{ marginRight: 10 }}
              />
            ) : null}
            <TextInput
              className="flex-1 py-3.5 font-sans-medium text-base text-ink-900"
              placeholderTextColor="#94a3b8"
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              onFocus={() => setIsFocused(true)}
              onChangeText={onChange}
              value={value as string}
              autoCapitalize="none"
              {...inputProps}
            />
          </View>
          {error ? (
            <Text className="mt-1.5 font-sans-medium text-xs text-red-500">{error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
