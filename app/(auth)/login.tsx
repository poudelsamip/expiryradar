import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { createLocalUser, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    if (!isSupabaseConfigured || !supabase) {
      setUser(createLocalUser(data.email));
      setIsSubmitting(false);
      router.replace('/(tabs)');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-8 text-3xl font-bold text-gray-900">Welcome back</Text>

      <FormField
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        placeholder="••••••••"
        secureTextEntry
      />

      <Button title="Log in" isLoading={isSubmitting} onPress={handleSubmit(onSubmit)} />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">Don&apos;t have an account? </Text>
        <Link href="/(auth)/signup" className="font-semibold text-blue-600">
          Sign up
        </Link>
      </View>
    </View>
  );
}
