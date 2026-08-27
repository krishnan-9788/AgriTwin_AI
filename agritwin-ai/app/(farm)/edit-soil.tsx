import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSoil, getSoilByFarm, updateSoil } from '../../services/soil';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const soilSchema = z.object({
  soil_type: z.string().min(2, 'Soil type is required'),
  moisture: z.coerce.number().min(0).max(100, 'Moisture must be 0-100'),
  ph: z.coerce.number().min(0).max(14, 'pH must be 0-14'),
  nitrogen: z.string().min(1, 'Nitrogen level is required (e.g. High, Medium, Low)'),
  phosphorus: z.string().min(1, 'Phosphorus level is required'),
  potassium: z.string().min(1, 'Potassium level is required'),
  n_val: z.coerce.number().optional().nullable(),
  p_val: z.coerce.number().optional().nullable(),
  k_val: z.coerce.number().optional().nullable(),
  ec: z.coerce.number().optional().nullable(),
  oc: z.coerce.number().optional().nullable(),
  s: z.coerce.number().optional().nullable(),
  zn: z.coerce.number().optional().nullable(),
  fe: z.coerce.number().optional().nullable(),
  cu: z.coerce.number().optional().nullable(),
  mn: z.coerce.number().optional().nullable(),
  b: z.coerce.number().optional().nullable(),
});

export default function EditSoilScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // This is the farm_id
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<any>({
    resolver: zodResolver(soilSchema),
    defaultValues: {
      soil_type: '',
      moisture: '',
      ph: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      n_val: null,
      p_val: null,
      k_val: null,
      ec: null,
      oc: null,
      s: null,
      zn: null,
      fe: null,
      cu: null,
      mn: null,
      b: null,
    }
  });

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Please select a farm first.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    const fetchExistingSoil = async () => {
      try {
        const farmIdNum = Number(id);
        const data = await getSoilByFarm(farmIdNum);
        if (data) {
          setIsUpdate(true);
          reset({
            soil_type: data.soil_type,
            moisture: data.moisture,
            ph: data.ph,
            nitrogen: data.nitrogen,
            phosphorus: data.phosphorus,
            potassium: data.potassium,
            n_val: data.n_val,
            p_val: data.p_val,
            k_val: data.k_val,
            ec: data.ec,
            oc: data.oc,
            s: data.s,
            zn: data.zn,
            fe: data.fe,
            cu: data.cu,
            mn: data.mn,
            b: data.b,
          });
        }
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          setIsUpdate(false);
        } else {
          console.error("Error fetching existing soil:", err);
        }
      } finally {
        setFetching(false);
      }
    };

    fetchExistingSoil();
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    if (!id) {
      Alert.alert('Error', 'Please select a farm first.');
      return;
    }
    
    try {
      setLoading(true);
      const farmIdNum = Number(id);
      
      if (isUpdate) {
        await updateSoil(farmIdNum, data);
      } else {
        await createSoil({ ...data, farm_id: farmIdNum });
      }

      Alert.alert('Success', 'Soil data saved successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      let errorMessage = 'Unable to save soil data.';
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
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-slate-900">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-slate-900"
    >
      <ScrollView contentContainerClassName="px-6 py-6 flex-grow pb-12">
        <Text className="text-xl font-bold text-gray-800 dark:text-white mb-6">{isUpdate ? 'Update Soil Data' : 'Add Soil Data'}</Text>
        
        <Controller control={control} name="soil_type" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Soil Type" placeholder="e.g. Loam" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.soil_type?.message} />
        )} />

        <View className="flex-row justify-between w-full">
          <View className="w-[48%]">
            <Controller control={control} name="moisture" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Moisture (%)" placeholder="0-100" keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value ? String(value) : ''} error={errors.moisture?.message} />
            )} />
          </View>
          <View className="w-[48%]">
            <Controller control={control} name="ph" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="pH Level" placeholder="0-14" keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value ? String(value) : ''} error={errors.ph?.message} />
            )} />
          </View>
        </View>

        <Controller control={control} name="nitrogen" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Nitrogen Level" placeholder="e.g. High, Medium, Low" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.nitrogen?.message} />
        )} />

        <Controller control={control} name="phosphorus" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Phosphorus Level" placeholder="e.g. High, Medium, Low" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.phosphorus?.message} />
        )} />

        <Controller control={control} name="potassium" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Potassium Level" placeholder="e.g. High, Medium, Low" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.potassium?.message} containerClassName="mb-6" />
        )} />

        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-2 mt-4">Advanced ML Parameters (Optional)</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-xs mb-4">Provide these precise numeric values to activate AI Soil Fertility Prediction.</Text>

        <View className="flex-row flex-wrap justify-between w-full">
          {[
            { name: "n_val", label: "Nitrogen (N)", ph: "mg/kg" },
            { name: "p_val", label: "Phosphorus (P)", ph: "mg/kg" },
            { name: "k_val", label: "Potassium (K)", ph: "mg/kg" },
            { name: "ec", label: "Elect. Cond. (EC)", ph: "dS/m" },
            { name: "oc", label: "Organic Carbon (OC)", ph: "%" },
            { name: "s", label: "Sulphur (S)", ph: "ppm" },
            { name: "zn", label: "Zinc (Zn)", ph: "ppm" },
            { name: "fe", label: "Iron (Fe)", ph: "ppm" },
            { name: "cu", label: "Copper (Cu)", ph: "ppm" },
            { name: "mn", label: "Manganese (Mn)", ph: "ppm" },
            { name: "b", label: "Boron (B)", ph: "ppm" }
          ].map((fieldData) => (
            <View className="w-[48%] mb-4" key={fieldData.name}>
              <Controller control={control} name={fieldData.name} render={({ field: { onChange, onBlur, value } }) => (
                <Input label={fieldData.label} placeholder={fieldData.ph} keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value ? String(value) : ''} />
              )} />
            </View>
          ))}
        </View>

        <Button title={isUpdate ? "Update Soil Data" : "Save Soil Data"} onPress={handleSubmit(onSubmit)} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
