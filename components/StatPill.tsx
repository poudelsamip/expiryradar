import { Text, View } from 'react-native';

type StatPillProps = {
  label: string;
  value: number;
  tone?: 'default' | 'danger';
};

export function StatPill({ label, value, tone = 'default' }: StatPillProps) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-ink-100 bg-white py-4">
      <Text
        className={`font-sans-extrabold text-2xl ${tone === 'danger' ? 'text-red-500' : 'text-ink-900'}`}
      >
        {value}
      </Text>
      <Text className="mt-1 font-sans-medium text-xs text-ink-500">{label}</Text>
    </View>
  );
}
