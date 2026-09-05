import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ItemRow } from '@/components/ItemRow';
import { SectionHeader } from '@/components/SectionHeader';
import { StatPill } from '@/components/StatPill';
import { EXPIRING_SOON_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { getNotificationPermission } from '@/lib/notifications';
import { daysUntil } from '@/lib/status';
import { GUEST_ITEM_LIMIT, useItemsStore } from '@/store/useItemsStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import type { Item } from '@/types/item';

const PREVIEW_LIMIT = 3;

function sortByKeyDate(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.key_date.localeCompare(b.key_date));
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { items, isLoading, isGuest, guestItemCount, loadForUser } = useItemsStore();
  const permission = useNotificationsStore((s) => s.permission);
  const setPermission = useNotificationsStore((s) => s.setPermission);

  useEffect(() => {
    loadForUser(user?.id ?? null);
  }, [user?.id, loadForUser]);

  // Re-check on every visit in case the user changed the permission in OS settings.
  useFocusEffect(
    useCallback(() => {
      getNotificationPermission().then(setPermission);
    }, [setPermission])
  );

  const { expired, expiringThisWeek, expiringSoonItems, upcomingItems, foodItems, returnsItems } =
    useMemo(() => {
      const expiringSoonCategorySet = new Set(EXPIRING_SOON_CATEGORIES);
      const expiringSoon: Item[] = [];
      const upcoming: Item[] = [];
      const food: Item[] = [];
      const returns: Item[] = [];
      let expiredCount = 0;
      let weekCount = 0;

      items.forEach((item) => {
        const days = daysUntil(item.key_date);
        if (days < 0) expiredCount += 1;
        if (days >= 0 && days <= 7) weekCount += 1;

        if (item.category === 'food') {
          food.push(item);
        } else if (item.category === 'returns') {
          returns.push(item);
        } else if (expiringSoonCategorySet.has(item.category)) {
          if (days <= 30) {
            expiringSoon.push(item);
          } else {
            upcoming.push(item);
          }
        }
      });

      return {
        expired: expiredCount,
        expiringThisWeek: weekCount,
        expiringSoonItems: sortByKeyDate(expiringSoon),
        upcomingItems: sortByKeyDate(upcoming),
        foodItems: sortByKeyDate(food),
        returnsItems: sortByKeyDate(returns),
      };
    }, [items]);

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadForUser(user?.id ?? null)} />
        }
      >
        <View className="mb-5">
          <Text className="font-sans-medium text-sm text-ink-500">Welcome back</Text>
          <Text className="font-sans-extrabold text-2xl text-ink-900">
            {user?.email ? user.email.split('@')[0] : 'Guest'}
          </Text>
        </View>

        {isGuest ? (
          <View className="mb-3 flex-row items-center rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
            <Ionicons name="person-circle-outline" size={20} color="#2563eb" />
            <Text className="ml-2 flex-1 font-sans-medium text-xs text-brand-700">
              Guest mode: {guestItemCount}/{GUEST_ITEM_LIMIT} items. Sign up to save them and unlock reminders.
            </Text>
          </View>
        ) : null}

        {permission === 'denied' || permission === 'unsupported' ? (
          <View className="mb-5 flex-row items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Ionicons name="notifications-off-outline" size={20} color="#b45309" />
            <Text className="ml-2 flex-1 font-sans-medium text-xs text-amber-800">
              {permission === 'denied'
                ? "Notifications are off, so reminders won't fire. Enable them in your device settings."
                : "Reminders can't be scheduled in Expo Go — run a development build to test them."}
            </Text>
          </View>
        ) : null}

        <View className="mb-6 flex-row gap-3">
          <StatPill label="Expired" value={expired} tone="danger" />
          <StatPill label="Due this week" value={expiringThisWeek} />
          <StatPill label="Total tracked" value={items.length} />
        </View>

        <View className="mb-6">
          <SectionHeader title="Expiring soon" />
          {expiringSoonItems.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" message="Nothing urgent right now." />
          ) : (
            <View className="gap-2">
              {expiringSoonItems.map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} />
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <SectionHeader
            title="Food"
            moreCount={foodItems.length > PREVIEW_LIMIT ? foodItems.length - PREVIEW_LIMIT : undefined}
            onPressMore={() => router.push('/(tabs)/items?category=food')}
          />
          {foodItems.length === 0 ? (
            <EmptyState icon="fast-food-outline" message="No food items tracked yet." />
          ) : (
            <View className="gap-2">
              {foodItems.slice(0, PREVIEW_LIMIT).map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} />
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <SectionHeader
            title="Returns & refunds"
            moreCount={
              returnsItems.length > PREVIEW_LIMIT ? returnsItems.length - PREVIEW_LIMIT : undefined
            }
            onPressMore={() => router.push('/(tabs)/items?category=returns')}
          />
          {returnsItems.length === 0 ? (
            <EmptyState icon="return-up-back-outline" message="No return windows tracked yet." />
          ) : (
            <View className="gap-2">
              {returnsItems.slice(0, PREVIEW_LIMIT).map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} />
              ))}
            </View>
          )}
        </View>

        {upcomingItems.length > 0 ? (
          <View className="mb-6 opacity-70">
            <SectionHeader title="Upcoming" />
            <View className="gap-2">
              {upcomingItems.map((item) => (
                <ItemRow key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
