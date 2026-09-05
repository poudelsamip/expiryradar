import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
} & PressableProps;

export function Button({ title, isLoading, variant = 'primary', disabled, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      className={`items-center justify-center rounded-lg py-3 ${
        isPrimary ? 'bg-blue-600' : 'bg-gray-100'
      } ${disabled || isLoading ? 'opacity-60' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#111'} />
      ) : (
        <Text className={`text-base font-semibold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
