import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ItemRow } from '@/components/ItemRow';
import { CATEGORIES, CATEGORY_LIST } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { computeStatus, STATUS_COLORS, STATUS_LABELS } from '@/lib/status';
import { useItemsStore } from '@/store/useItemsStore';
import { ITEM_STATUSES, type CategoryKey, type Item, type ItemStatus } from '@/types/item';

type CategoryFilter = CategoryKey | 'all';
type StatusFilter = ItemStatus | 'all';

const ALL_COLOR = '#2563eb';

type FilterChipProps = {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
};

// One chip shape for both filter rows: category chips lead with the category
// icon, status chips with a status-coloured dot. A selected chip adopts its own
// colour, so the filter rows read as a legend rather than a toolbar.
function FilterChip({ label, count, color, active, onPress, icon, dot }: FilterChipProps) {
  const empty = count === 0 && !active;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-70"
      style={{
        borderColor: active ? color : '#e2e8f0',
        backgroundColor: active ? `${color}14` : '#ffffff',
        opacity: empty ? 0.55 : 1,
      }}
    >
      {dot ? (
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      ) : icon ? (
        <Ionicons name={icon} size={14} color={active ? color : '#94a3b8'} />
      ) : null}

      <Text className="font-sans-semibold text-xs" style={{ color: active ? color : '#475569' }}>
        {label}
      </Text>

      <Text className="font-sans-bold text-[11px]" style={{ color: active ? color : '#94a3b8' }}>
        {count}
      </Text>
    </Pressable>
  );
}

export default function ItemsScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { user } = useAuth();
  const { items, isLoading, loadForUser } = useItemsStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    (params.category as CategoryFilter) ?? 'all'
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lastParamCategory, setLastParamCategory] = useState(params.category);

  // A fresh navigation (e.g. Home's "View all" link) should override the
  // filter even if this screen is already mounted from a prior visit.
  if (params.category !== lastParamCategory) {
    setLastParamCategory(params.category);
    setCategoryFilter((params.category as CategoryFilter) ?? 'all');
  }

  useEffect(() => {
    loadForUser(user?.id ?? null);
  }, [user?.id, loadForUser]);

  const { sections, resultCount, categoryCounts, statusCounts } = useMemo(() => {
    const query = search.trim().toLowerCase();
    const searched = items.filter((item) => !query || item.name.toLowerCase().includes(query));

    // Each row counts against the *other* filter, so a chip's number always
    // matches what tapping it actually produces.
    const catCounts = { all: 0 } as Record<CategoryFilter, number>;
    CATEGORY_LIST.forEach((c) => {
      catCounts[c.key] = 0;
    });
    const statCounts = { all: 0 } as Record<StatusFilter, number>;
    ITEM_STATUSES.forEach((s) => {
      statCounts[s] = 0;
    });

    const matched: Item[] = [];

    searched.forEach((item) => {
      const status = computeStatus(item.key_date);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      if (matchesStatus) {
        catCounts.all += 1;
        catCounts[item.category] += 1;
      }
      if (matchesCategory) {
        statCounts.all += 1;
        statCounts[status] += 1;
      }
      if (matchesCategory && matchesStatus) matched.push(item);
    });

    const byStatus = new Map<ItemStatus, Item[]>();
    matched
      .sort((a, b) => a.key_date.localeCompare(b.key_date))
      .forEach((item) => {
        const status = computeStatus(item.key_date);
        const bucket = byStatus.get(status);
        if (bucket) bucket.push(item);
        else byStatus.set(status, [item]);
      });

    // Sections follow the urgency order of ITEM_STATUSES.
    const grouped = ITEM_STATUSES.filter((s) => byStatus.has(s)).map((status) => ({
      status,
      data: byStatus.get(status) as Item[],
    }));

    return {
      sections: grouped,
      resultCount: matched.length,
      categoryCounts: catCounts,
      statusCounts: statCounts,
    };
  }, [items, categoryFilter, statusFilter, search]);

  const hasFilters = categoryFilter !== 'all' || statusFilter !== 'all' || search.trim().length > 0;

  const clearFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSearch('');
  };

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={['top']}>
      <View className="px-5 pb-2 pt-2">
        <View className="mb-4 flex-row items-end justify-between">
          <View>
            <Text className="font-sans-extrabold text-2xl text-ink-900">All items</Text>
            <Text className="mt-0.5 font-sans-medium text-xs text-ink-500">
              {resultCount} {resultCount === 1 ? 'item' : 'items'}
              {hasFilters ? ' matching' : ' tracked'}
            </Text>
          </View>
          {hasFilters ? (
            <Pressable onPress={clearFilters} hitSlop={8} className="active:opacity-60">
              <Text className="font-sans-semibold text-xs text-brand-600">Clear filters</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="mb-4 flex-row items-center rounded-2xl border border-ink-200 bg-white px-4">
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            className="ml-2 flex-1 py-3 font-sans-medium text-sm text-ink-900"
            placeholder="Search items"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        <Text className="mb-2 font-sans-bold text-[11px] uppercase tracking-wide text-ink-400">
          Status
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 mb-4 px-5">
          <View className="flex-row gap-2 pr-5">
            <FilterChip
              label="All"
              icon="layers-outline"
              color={ALL_COLOR}
              count={statusCounts.all}
              active={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
            />
            {ITEM_STATUSES.map((s) => (
              <FilterChip
                key={s}
                label={STATUS_LABELS[s]}
                dot
                color={STATUS_COLORS[s]}
                count={statusCounts[s]}
                active={statusFilter === s}
                onPress={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              />
            ))}
          </View>
        </ScrollView>

        <Text className="mb-2 font-sans-bold text-[11px] uppercase tracking-wide text-ink-400">
          Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
          <View className="flex-row gap-2 pr-5">
            <FilterChip
              label="All"
              icon="grid-outline"
              color={ALL_COLOR}
              count={categoryCounts.all}
              active={categoryFilter === 'all'}
              onPress={() => setCategoryFilter('all')}
            />
            {CATEGORY_LIST.map((c) => (
              <FilterChip
                key={c.key}
                label={c.label}
                icon={c.icon}
                color={c.color}
                count={categoryCounts[c.key]}
                active={categoryFilter === c.key}
                onPress={() => setCategoryFilter(categoryFilter === c.key ? 'all' : c.key)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item: Item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 32 }}
        stickySectionHeadersEnabled
        refreshing={isLoading}
        onRefresh={() => loadForUser(user?.id ?? null)}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center gap-2 bg-ink-50 pb-2 pt-3">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[section.status] }}
            />
            <Text
              className="font-sans-bold text-xs uppercase tracking-wide"
              style={{ color: STATUS_COLORS[section.status] }}
            >
              {STATUS_LABELS[section.status]}
            </Text>
            <Text className="font-sans-semibold text-xs text-ink-400">{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="pb-2">
            <ItemRow item={item} onPress={() => router.push(`/item/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={categoryFilter === 'all' ? 'file-tray-outline' : CATEGORIES[categoryFilter].icon}
            message={
              items.length === 0
                ? 'Nothing tracked yet. Tap + to add your first item.'
                : 'No items match your filters.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}
