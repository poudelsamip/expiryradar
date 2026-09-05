import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ExpiryCallout, RadarBlips } from '@/components/RadarBlips';
import { Logo } from '@/components/Logo';
import { RadarGlow } from '@/components/RadarGlow';
import { RadarSweep } from '@/components/RadarSweep';

const RADAR_SIZE = 280;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-ink-950">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#172554', '#1e3a8a', '#0f172a']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      <View className="absolute -right-32 -top-24">
        <RadarGlow size={360} />
      </View>
      <View className="absolute -bottom-24 -left-28">
        <RadarGlow size={280} />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="flex-row items-center gap-2 px-7 pt-2"
        >
          <Logo size={30} />
          <Text className="font-sans-bold text-base text-white">Expiry Radar</Text>
        </Animated.View>

        <View className="flex-1 items-center justify-center">
          <View style={{ width: RADAR_SIZE, height: RADAR_SIZE }} className="items-center justify-center">
            <Animated.View entering={FadeIn.delay(150).duration(700)} className="absolute inset-0">
              <RadarSweep size={RADAR_SIZE} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(300).duration(500)}>
              <RadarBlips size={RADAR_SIZE} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(600).springify()}>
              <View className="h-[84px] w-[84px] items-center justify-center rounded-[28px] border border-white/15 bg-ink-900/70">
                <Logo size={56} />
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(650).duration(500)}>
              <ExpiryCallout />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>

      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        className="rounded-t-[36px] bg-white px-7 pt-8"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Text className="font-sans-extrabold text-[28px] leading-9 text-ink-900">
          Track what expires,{'\n'}before it&apos;s too late.
        </Text>
        <Text className="mt-3 font-sans-medium text-[15px] leading-6 text-ink-500">
          Food, documents, warranties and subscriptions — one radar watching every deadline for you.
        </Text>

        <View className="mt-7 gap-3">
          <Button title="Get started" onPress={() => router.push('/(auth)/signup')} />

          <Pressable
            className="flex-row items-center justify-center py-2 active:opacity-70"
            onPress={() => router.push('/(auth)/login')}
          >
            <Text className="font-sans-medium text-sm text-ink-500">Already have an account? </Text>
            <Text className="font-sans-bold text-sm text-brand-600">Log in</Text>
          </Pressable>

          <Pressable
            className="items-center py-2 active:opacity-70"
            onPress={() => router.replace('/(tabs)')}
          >
            <Text className="font-sans-semibold text-sm text-ink-400">Continue as guest</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
