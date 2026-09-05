import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { GoogleButton } from '@/components/GoogleButton';
import { OrDivider } from '@/components/OrDivider';
import { createLocalUser, isSupabaseConfigured, signInWithGoogle, supabase } from '@/lib/supabase';
import { signupSchema, type SignupFormData } from '@/lib/validation';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignupScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const { control, handleSubmit } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);

    if (!isSupabaseConfigured || !supabase) {
      setUser(createLocalUser(data.email, data.name));
      setIsSubmitting(false);
      router.replace('/(tabs)');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    Alert.alert('Check your inbox', 'Confirm your email to finish creating your account.');
    router.replace('/(auth)/login');
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
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-8 text-3xl font-bold text-gray-900">Create an account</Text>

      <FormField
        control={control}
        name="name"
        label="Name"
        placeholder="Jane Doe"
        autoCapitalize="words"
      />
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
      <FormField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        placeholder="••••••••"
        secureTextEntry
      />

      <Button title="Sign up" isLoading={isSubmitting} onPress={handleSubmit(onSubmit)} />

      <OrDivider />

      <GoogleButton isLoading={isGoogleLoading} onPress={onGooglePress} />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-500">Already have an account? </Text>
        <Link href="/(auth)/login" className="font-semibold text-blue-600">
          Log in
        </Link>
      </View>
    </View>
  );
}
