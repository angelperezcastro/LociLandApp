import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export async function getOnboardingSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.onboardingSeen);
  return value === 'true';
}

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, 'true');
}

export async function resetOnboardingSeen(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.onboardingSeen);
}