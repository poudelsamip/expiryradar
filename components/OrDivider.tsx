import { Text, View } from 'react-native';

export function OrDivider() {
  return (
    <View className="my-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-ink-200" />
      <Text className="font-sans-medium text-xs uppercase tracking-wider text-ink-400">or</Text>
      <View className="h-px flex-1 bg-ink-200" />
    </View>
  );
}
