import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function FarmLayout() {
  const router = useRouter();

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#2E7D32' },
      headerTintColor: '#fff',
      headerLeft: ({ canGoBack }) => canGoBack ? (
        <TouchableOpacity onPress={() => router.back()} className="mr-4 ml-2">
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ) : null
    }}>
      <Stack.Screen name="create-farm" options={{ title: 'Create Farm' }} />
      <Stack.Screen name="farm-profile" options={{ title: 'Farm Details' }} />
      <Stack.Screen name="edit-farm" options={{ title: 'Edit Farm' }} />
    </Stack>
  );
}
