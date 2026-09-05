import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  return (
    <Pressable
      className="flex-1 bg-white"
      onPress={() => router.replace('/(auth)/login')}
    >
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl font-bold text-blue-600">Expiry Radar</Text>
        </View>
        <Text className="mb-10 text-center text-base font-medium text-gray-400">
          Tap to continue
        </Text>
      </SafeAreaView>
    </Pressable>
  );
}
