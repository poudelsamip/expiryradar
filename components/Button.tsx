import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
} & PressableProps;

export function Button({ title, isLoading, variant = 'primary', disabled, ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`overflow-hidden rounded-2xl active:opacity-90 ${isDisabled ? 'opacity-60' : ''} ${
        isPrimary ? '' : 'border border-ink-200 bg-ink-50 py-4'
      }`}
      disabled={isDisabled}
      {...props}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-sans-bold text-base text-white">{title}</Text>
          )}
        </LinearGradient>
      ) : isLoading ? (
        <ActivityIndicator color="#1e293b" />
      ) : (
        <Text className="text-center font-sans-bold text-base text-ink-800">{title}</Text>
      )}
    </Pressable>
  );
}
