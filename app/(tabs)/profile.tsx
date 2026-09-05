import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { SettingsSection } from '@/components/SettingsSection';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount } from '@/lib/account';
import { GUEST_ITEM_LIMIT, useItemsStore } from '@/store/useItemsStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const items = useItemsStore((s) => s.items);
  const loadForUser = useItemsStore((s) => s.loadForUser);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile can be the first screen opened, so make sure the count is real.
  useEffect(() => {
    loadForUser(user?.id ?? null);
  }, [user?.id, loadForUser]);

  const handleDeleteAccount = () => {
    if (!user) return;
    Alert.alert(
      'Delete account?',
      'This permanently deletes all your items, photos, and reminders. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await deleteAccount(user.id);
            setIsDeleting(false);
            if (error) {
              Alert.alert('Almost done', error);
            }
            router.replace('/');
          },
        },
      ]
    );
  };

  const initial = (user?.email ?? 'G').charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="mb-5 font-sans-extrabold text-2xl text-ink-900">Profile</Text>

        <View className="mb-6 items-center rounded-2xl border border-ink-100 bg-white p-5">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <Text className="font-sans-extrabold text-2xl text-brand-600">{initial}</Text>
          </View>
          <Text className="mt-3 font-sans-bold text-lg text-ink-900">
            {user?.email ? user.email.split('@')[0] : 'Guest'}
          </Text>
          <Text className="mt-1 font-sans-medium text-sm text-ink-500">
            {user?.email ?? 'Not signed in'}
          </Text>
          <Text className="mt-3 font-sans-medium text-xs text-ink-400">
            {items.length} item{items.length === 1 ? '' : 's'} tracked
          </Text>
        </View>

        <SettingsSection title="Account">
          {user ? (
            <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
          ) : (
            <>
              <Text className="font-sans-medium text-sm text-ink-500">
                You&apos;re browsing as a guest. Items are stored on this device only, up to{' '}
                {GUEST_ITEM_LIMIT} at a time.
              </Text>
              <Button title="Create an account" onPress={() => router.push('/(auth)/signup')} />
              <Button title="Log in" variant="secondary" onPress={() => router.push('/(auth)/login')} />
            </>
          )}
        </SettingsSection>

        {user ? (
          <SettingsSection title="Danger zone">
            <Text className="font-sans-medium text-sm text-ink-500">
              Permanently delete your account and everything in it.
            </Text>
            {isDeleting ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Pressable onPress={handleDeleteAccount} className="active:opacity-70">
                <Text className="font-sans-bold text-sm text-red-500">Delete account</Text>
              </Pressable>
            )}
          </SettingsSection>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
