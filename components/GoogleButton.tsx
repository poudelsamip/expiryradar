import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type GoogleButtonProps = {
  isLoading?: boolean;
} & PressableProps;

export function GoogleButton({ isLoading, disabled, ...props }: GoogleButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white py-3.5 active:opacity-80 ${
        disabled || isLoading ? 'opacity-60' : ''
      }`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="#1e293b" />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text className="font-sans-semibold text-base text-ink-800">Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}
