export type AgeGroup = '6-9' | '10-14';

export type AvatarEmoji =
  | '🦊'
  | '🐸'
  | '🦁'
  | '🐼'
  | '🦋'
  | '🐉'
  | '🦄'
  | '🐬';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarEmoji: AvatarEmoji;
  ageGroup: AgeGroup;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
}