import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export function Button({ 
  title, 
  loading = false, 
  variant = 'primary', 
  className,
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseClasses = "py-3 px-6 rounded-lg items-center justify-center flex-row";
  
  const variants = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "bg-transparent border-2 border-primary",
    ghost: "bg-transparent",
  };
  
  const textVariants = {
    primary: "text-white font-bold text-lg",
    secondary: "text-white font-bold text-lg",
    outline: "text-primary font-bold text-lg",
    ghost: "text-primary font-bold text-lg",
  };

  return (
    <TouchableOpacity
      className={twMerge(clsx(
        baseClasses, 
        variants[variant], 
        disabled || loading ? 'opacity-50' : '',
        className
      ))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#2E7D32' : '#ffffff'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
