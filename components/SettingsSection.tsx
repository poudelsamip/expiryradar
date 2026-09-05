import { Text, View } from 'react-native';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View className="mb-6">
      <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wide text-ink-400">
        {title}
      </Text>
      <View className="gap-3 rounded-2xl border border-ink-100 bg-white p-4">{children}</View>
    </View>
  );
}
