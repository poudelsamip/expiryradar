import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { SettingsSection } from '@/components/SettingsSection';
import { useAuth } from '@/hooks/useAuth';
import { exportUserData } from '@/lib/dataExport';
import { getNotificationPermission } from '@/lib/notifications';
import { useNotificationsStore } from '@/store/useNotificationsStore';

export default function SettingsScreen() {
  const { user } = useAuth();
  const permission = useNotificationsStore((s) => s.permission);
  const setPermission = useNotificationsStore((s) => s.setPermission);
  const [isExporting, setIsExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getNotificationPermission().then(setPermission);
    }, [setPermission])
  );

  const handleExport = async () => {
    setIsExporting(true);
    const { error } = await exportUserData(user?.id ?? null);
    setIsExporting(false);
    if (error) Alert.alert('Export failed', error);
  };

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="mb-5 font-sans-extrabold text-2xl text-ink-900">Settings</Text>

        <SettingsSection title="Notifications">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={permission === 'granted' ? 'notifications' : 'notifications-off-outline'}
              size={18}
              color={permission === 'granted' ? '#16a34a' : '#b45309'}
            />
            <Text className="flex-1 font-sans-medium text-sm text-ink-700">
              {permission === 'granted'
                ? 'Reminders are enabled.'
                : permission === 'denied'
                  ? 'Reminders are turned off.'
                  : permission === 'unsupported'
                    ? 'Reminders need a development build — they are unavailable in Expo Go.'
                    : 'Reminder permission not yet decided.'}
            </Text>
          </View>
          {permission !== 'granted' && permission !== 'unsupported' ? (
            <Pressable onPress={() => Linking.openSettings()} className="active:opacity-70">
              <Text className="font-sans-semibold text-sm text-brand-600">Open device settings</Text>
            </Pressable>
          ) : null}
        </SettingsSection>

        <SettingsSection title="Data">
          <Text className="font-sans-medium text-sm text-ink-500">
            Export everything you&apos;re tracking as a JSON file.
          </Text>
          <Button
            title={isExporting ? 'Preparing export…' : 'Export my data'}
            variant="secondary"
            isLoading={isExporting}
            onPress={handleExport}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
