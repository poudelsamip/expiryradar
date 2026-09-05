import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type GoogleButtonProps = {
  isLoading?: boolean;
} & PressableProps;

export function GoogleButton({ isLoading, disabled, ...props }: GoogleButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 ${
        disabled || isLoading ? 'opacity-60' : ''
      }`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#111" />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text className="text-base font-semibold text-gray-900">Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}
