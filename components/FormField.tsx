import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
} & TextInputProps;

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
          <TextInput
            className={`rounded-lg border px-4 py-3 text-base ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value as string}
            autoCapitalize="none"
            {...inputProps}
          />
          {error ? <Text className="mt-1 text-xs text-red-500">{error.message}</Text> : null}
        </View>
      )}
    />
  );
}
