import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Removed firebase imports
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock network delay
      setSuccess(true);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your inbox for instructions to reset your password.',
        [{ text: 'Back to Login', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-slate-900"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-primary mb-2">Reset Password</Text>
          <Text className="text-gray-600 dark:text-gray-300 text-base text-center px-4">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <View className="w-full">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                containerClassName="mb-8"
              />
            )}
          />

          <Button 
            title={success ? "Resend Link" : "Send Reset Link"} 
            onPress={handleSubmit(onSubmit)} 
            loading={loading} 
            className="mb-4"
          />
          
          <View className="flex-row justify-center mt-4">
            <Link href="/(auth)/login" asChild>
              <Text className="text-primary font-bold">Back to Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
