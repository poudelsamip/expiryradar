import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
};

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-6">
      <Ionicons name={icon} size={22} color="#94a3b8" />
      <Text className="mt-2 text-center font-sans-medium text-sm text-ink-500">{message}</Text>
    </View>
  );
}
