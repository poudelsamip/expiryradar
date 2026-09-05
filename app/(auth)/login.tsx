import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { GoogleButton } from '@/components/GoogleButton';
import { OrDivider } from '@/components/OrDivider';
import { signInWithGoogle, supabase } from '@/lib/supabase';
import { loginSchema, type LoginFormData } from '@/lib/validation';

export default function LoginScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

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

  const onGooglePress = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (error) {
      Alert.alert('Google sign-in failed', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to keep every expiry date on your radar."
        />

        <View className="flex-1 px-6 pt-8">
          <FormField
            control={control}
            name="email"
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <FormField
            control={control}
            name="password"
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
          />

          <View className="mt-2">
            <Button title="Log in" isLoading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          </View>

          <OrDivider />

          <GoogleButton isLoading={isGoogleLoading} onPress={onGooglePress} />

          <View className="mb-8 mt-6 flex-row justify-center">
            <Text className="font-sans-medium text-ink-500">Don&apos;t have an account? </Text>
            <Link href="/(auth)/signup" className="font-sans-bold text-brand-600">
              Sign up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
