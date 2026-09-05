import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { computeStatus, formatDaysLabel, STATUS_COLORS } from '@/lib/status';
import type { Item } from '@/types/item';

type ItemRowProps = {
  item: Item;
  onPress?: () => void;
};

export function ItemRow({ item, onPress }: ItemRowProps) {
  const category = CATEGORIES[item.category];
  const status = computeStatus(item.key_date);
  const statusColor = STATUS_COLORS[status];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl border border-ink-100 bg-white px-4 py-3 active:opacity-70"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${category.color}1a` }}
      >
        <Ionicons name={category.icon} size={20} color={category.color} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-sans-semibold text-[15px] text-ink-900" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-0.5 font-sans-medium text-xs text-ink-500">
          {category.label}
          {item.quantity ? ` · x${item.quantity}` : ''}
        </Text>
      </View>

      <View className="items-end">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <Text className="font-sans-bold text-xs" style={{ color: statusColor }}>
            {formatDaysLabel(item.key_date)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
