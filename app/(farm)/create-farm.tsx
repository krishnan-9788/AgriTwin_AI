import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/auth';
import { createFarm } from '../../services/farm';
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

export default function CreateFarmScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      farmerName: user?.displayName || '',
      farmName: '',
      location: '',
      size: 0,
      soilType: '',
      waterSource: '',
      currentCrop: '',
      plantingDate: '',
    }
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    try {
      setLoading(true);
      const newFarm = await createFarm({
        ...data
      });
      
      // Automatically create default soil values
      if (newFarm && newFarm.id) {
        try {
          // Dynamic import to avoid adding to top-level if we don't want to mess up other imports, 
          // actually let's just do it cleanly via standard import. I will modify the top of the file as well.
          const { createSoil } = require('../../services/soil');
          await createSoil({
            farm_id: newFarm.id,
            soil_type: "Loamy Soil",
            moisture: 76,
            ph: 6.8,
            nitrogen: "High",
            phosphorus: "Medium",
            potassium: "High"
          });
        } catch (soilErr) {
          console.error("Failed to create default soil data:", soilErr);
          // 5. If Soil API fails, Farm should still remain created.
        }
      }

      if (Platform.OS === 'web') {
        window.alert('Farm created successfully!');
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Success', 'Farm created successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }
        ]);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create farm';
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
          errorMessage = typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail);
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error("[CREATE FARM] UI Error Caught:", errorMessage);
      Alert.alert('Error', errorMessage);
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
        className={Platform.OS === 'web' ? 'px-6 py-6 pb-12' : ''}
        contentContainerClassName={Platform.OS !== 'web' ? 'px-6 py-6 flex-grow pb-12' : undefined}
      >
        <Text className="text-xl font-bold text-gray-800 dark:text-white mb-6">Farm Details</Text>
        
        <Controller
          control={control}
          name="farmerName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Farmer Name" placeholder="e.g. John Doe" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.farmerName?.message === "string" ? errors.farmerName.message : undefined} />
          )}
        />

        <Controller
          control={control}
          name="farmName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Farm Name" placeholder="e.g. Green Acres" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.farmName?.message === "string" ? errors.farmName.message : undefined} />
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Location" placeholder="City, State" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.location?.message === "string" ? errors.location.message : undefined} />
          )}
        />

        <View className="flex-row justify-between w-full">
          <View className="w-[48%]">
            <Controller
              control={control}
              name="size"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Size (Acres)" placeholder="0.0" keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value ? String(value) : ''} error={typeof errors.size?.message === "string" ? errors.size.message : undefined} />
              )}
            />
          </View>
          <View className="w-[48%]">
            <Controller
              control={control}
              name="soilType"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label="Soil Type" placeholder="e.g. Loam" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.soilType?.message === "string" ? errors.soilType.message : undefined} />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="waterSource"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Water Source" placeholder="e.g. Well, River" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.waterSource?.message === "string" ? errors.waterSource.message : undefined} />
          )}
        />

        <Controller
          control={control}
          name="currentCrop"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Current Crop" placeholder="e.g. Corn" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.currentCrop?.message === "string" ? errors.currentCrop.message : undefined} />
          )}
        />

        <Controller
          control={control}
          name="plantingDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Planting Date" placeholder="YYYY-MM-DD" onBlur={onBlur} onChangeText={onChange} value={value} error={typeof errors.plantingDate?.message === "string" ? errors.plantingDate.message : undefined} containerClassName="mb-6" />
          )}
        />

        <Button title="Save Farm" onPress={handleSubmit(onSubmit)} loading={loading} />
      </ScrollContainer>
    </Wrapper>
  );
}

