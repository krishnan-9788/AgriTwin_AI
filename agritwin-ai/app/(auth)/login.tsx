import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      await login(data.email.trim(), data.password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const ScrollContainer = Platform.OS === 'web' ? View : ScrollView;

  return (
    <Wrapper 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-slate-900"
    >
      <ScrollContainer 
        className={Platform.OS === 'web' ? 'flex-grow justify-center px-6 py-12' : ''}
        contentContainerClassName={Platform.OS !== 'web' ? 'flex-grow justify-center px-6 py-12' : undefined}
      >
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-primary mb-2">AgriTwin AI</Text>
          <Text className="text-gray-600 dark:text-gray-300 text-base text-center">
            Sign in to manage your digital farms
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
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />
          
          <View className="items-end mb-6">
            <Link href="/(auth)/forgot-password" asChild>
              <Text className="text-secondary font-semibold">Forgot Password?</Text>
            </Link>
          </View>

          <Button 
            title="Sign In" 
            onPress={handleSubmit(onSubmit)} 
            loading={loading} 
            className="mb-4"
          />
          
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600 dark:text-gray-300">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="text-primary font-bold">Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollContainer>
    </Wrapper>
  );
}
