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
import { signupSchema, type SignupFormData } from '@/lib/validation';

export default function SignupScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { control, handleSubmit } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // Supabase returns a session immediately when "Confirm email" is off for
    // the project, so skip straight into the app instead of gating on it.
    router.replace(signUpData.session ? '/(tabs)' : '/(auth)/login');
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
          title="Create account"
          subtitle="Track food, documents, warranties and subscriptions."
        />

        <View className="flex-1 px-6 pt-8">
          <FormField
            control={control}
            name="name"
            label="Name"
            icon="person-outline"
            placeholder="Jane Doe"
            autoCapitalize="words"
          />
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
          <FormField
            control={control}
            name="confirmPassword"
            label="Confirm password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
          />

          <View className="mt-2">
            <Button title="Sign up" isLoading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          </View>

          <OrDivider />

          <GoogleButton isLoading={isGoogleLoading} onPress={onGooglePress} />

          <View className="mb-8 mt-6 flex-row justify-center">
            <Text className="font-sans-medium text-ink-500">Already have an account? </Text>
            <Link href="/(auth)/login" className="font-sans-bold text-brand-600">
              Log in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
