import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, Platform } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={twMerge("w-full mb-4", containerClassName)}>
      {label && (
        <Text className="text-gray-700 dark:text-gray-200 dark:text-gray-300 font-semibold mb-2 ml-1">
          {label}
        </Text>
      )}
      
      <View 
        className={twMerge(
          "border-2 rounded-lg bg-white dark:bg-slate-800 px-4 py-3 flex-row items-center",
          isFocused ? "border-primary" : "border-gray-200 dark:border-slate-700",
          error ? "border-red-500" : ""
        )}
      >
        <TextInput
          className={twMerge(
            "flex-1 text-base text-gray-800 dark:text-white", 
            Platform.OS === 'web' ? 'outline-none' : '',
            className
          )}
          placeholderTextColor="#9ca3af"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
