import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFarm, updateFarm } from '../../services/farm';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const farmSchema = z.object({
  farmerName: z.string().min(2, 'Farmer name is required'),
  farmName: z.string().min(2, 'Farm name is required'),
  location: z.string().min(2, 'Location is required'),
  size: z.coerce.number().positive('Size must be positive'),
  soilType: z.string().min(2, 'Soil type is required'),
  waterSource: z.string().min(2, 'Water source is required'),
  currentCrop: z.string().min(2, 'Current crop is required'),
  plantingDate: z.string().min(2, 'Planting date is required (e.g. YYYY-MM-DD)'),
});

type FarmForm = z.infer<typeof farmSchema>;

export default function EditFarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<any>({
    resolver: zodResolver(farmSchema),
  });

  useEffect(() => {
    if (id) {
      getFarm(id).then(data => {
        if (data) {
          reset({
            farmerName: data.farmerName,
            farmName: data.farmName,
            location: data.location,
            size: data.size,
            soilType: data.soilType,
            waterSource: data.waterSource,
            currentCrop: data.currentCrop,
            plantingDate: data.plantingDate,
          });
        }
        setFetching(false);
      });
    }
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    if (!id) return;
    try {
      setLoading(true);
      await updateFarm(id, data);
      Alert.alert('Success', 'Farm updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update farm');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2E7D32" /></View>;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-slate-900"
    >
      <ScrollView contentContainerClassName="px-6 py-6 flex-grow pb-12">
        <Text className="text-xl font-bold text-gray-800 dark:text-white mb-6">Edit Farm Details</Text>
        
        <Controller control={control} name="farmerName" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Farmer Name" placeholder="e.g. John Doe" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.farmerName?.message === "string" ? errors.farmerName.message : undefined} />
        )} />

        <Controller control={control} name="farmName" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Farm Name" placeholder="e.g. Green Acres" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.farmName?.message === "string" ? errors.farmName.message : undefined} />
        )} />

        <Controller control={control} name="location" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Location" placeholder="City, State" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.location?.message === "string" ? errors.location.message : undefined} />
        )} />

        <View className="flex-row justify-between w-full">
          <View className="w-[48%]">
            <Controller control={control} name="size" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Size (Acres)" placeholder="0.0" keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value ? String(value) : ''} error={typeof errors.size?.message === "string" ? errors.size.message : undefined} />
            )} />
          </View>
          <View className="w-[48%]">
            <Controller control={control} name="soilType" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Soil Type" placeholder="e.g. Loam" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.soilType?.message === "string" ? errors.soilType.message : undefined} />
            )} />
          </View>
        </View>

        <Controller control={control} name="waterSource" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Water Source" placeholder="e.g. Well, River" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.waterSource?.message === "string" ? errors.waterSource.message : undefined} />
        )} />

        <Controller control={control} name="currentCrop" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Current Crop" placeholder="e.g. Corn" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.currentCrop?.message === "string" ? errors.currentCrop.message : undefined} />
        )} />

        <Controller control={control} name="plantingDate" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Planting Date" placeholder="YYYY-MM-DD" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.plantingDate?.message === "string" ? errors.plantingDate.message : undefined} containerClassName="mb-6" />
        )} />

        <Button title="Save Changes" onPress={handleSubmit(onSubmit)} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

