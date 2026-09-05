import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { RadarGlow } from '@/components/RadarGlow';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <LinearGradient
      colors={['#2563eb', '#172554']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
        paddingTop: 72,
        paddingBottom: 36,
        paddingHorizontal: 28,
      }}
    >
      <View className="absolute -right-16 -top-20">
        <RadarGlow size={260} />
      </View>

      <Logo size={52} />
      <Text className="mt-5 font-sans-extrabold text-3xl text-white">{title}</Text>
      <Text className="mt-1.5 font-sans-medium text-sm text-brand-100/80">{subtitle}</Text>
    </LinearGradient>
  );
}
