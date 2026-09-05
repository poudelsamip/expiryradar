import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  moreCount?: number;
  onPressMore?: () => void;
};

export function SectionHeader({ title, moreCount, onPressMore }: SectionHeaderProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="font-sans-bold text-lg text-ink-900">{title}</Text>
      {moreCount ? (
        <Pressable hitSlop={8} onPress={onPressMore}>
          <Text className="font-sans-semibold text-xs text-brand-600">+{moreCount} more</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
