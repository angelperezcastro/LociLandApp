import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  CreatePalace: undefined;
  PalaceDetail: { palaceId?: string } | undefined;
  AddStation: { palaceId: string };
  Review: { palaceId?: string } | undefined;
  Achievements: undefined;
  ComponentShowcase: undefined;
};

export type AuthStackParamList = {
  Onboarding01: undefined;
  Onboarding02: undefined;
  Onboarding03: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  CreatePalace: undefined;
  PalaceDetail: { palaceId: string };
  AddStation: { palaceId: string };
  Review: { palaceId: string };
  Achievements: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppTabScreenProps<T extends keyof AppTabParamList> =
  BottomTabScreenProps<AppTabParamList, T>;

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;