import { Text, View } from 'react-native';

export function OrDivider() {
  return (
    <View className="my-6 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-gray-200" />
      <Text className="text-sm text-gray-400">or</Text>
      <View className="h-px flex-1 bg-gray-200" />
    </View>
  );
}
