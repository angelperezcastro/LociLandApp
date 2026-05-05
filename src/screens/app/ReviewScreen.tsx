import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  RouteProp,
  useNavigation,
  usePreventRemove,
  useRoute,
} from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import Animated, {
  BounceIn,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { GuideLottie } from '../../components/review/GuideLottie';
import { selectAuthUserId, useUserStore } from '../../store/useUserStore';
import { useConfettiStore } from '../../store/useConfettiStore';
import { normalizeAgeGroup } from '../../utils/ageGroup';
import { XP_REWARDS } from '../../utils/levelUtils';
import {
  completeReview,
  recordAnswer,
  startReview,
} from '../../services/reviewService';
import { getReviewScreenData } from '../../services/reviewScreenDataService';
import type {
  ReviewScreenData,
  ReviewScreenStation,
} from '../../services/reviewScreenDataService';
import type { ReviewScreenState } from '../../types/reviewState';
import type { ReviewSession } from '../../types/review';
import {
  colors,
  fontSizes,
  radius as radiusTokens,
  spacing,
} from '../../theme';

type ReviewAgeGroup = '6-9' | '10-14';

type ReviewRouteParams = {
  Review: {
    palaceId: string;
    initialPalace?: ReviewScreenData['palace'];
    initialStations?: ReviewScreenStation[];
    ageGroup?: ReviewAgeGroup;
  };
};

type RevealResult = {
  stationId: string;
  correct: boolean;
  correctAnswer: string;
  chosenAnswer?: string | null;
  gaveUp: boolean;
};

const DEFAULT_REVIEW_AGE_GROUP: ReviewAgeGroup = '6-9';

const INTRO_COPY = {
  startButton: 'Start the Journey!',
  loading: 'Preparing your memory walk...',
  errorTitle: 'Review unavailable',
  notEnoughStations:
    'This palace needs at least 2 stations before starting a review.',
};

const WALKING_COPY = {
  prompt: 'What did you place here?',
  rememberButton: 'I remember!',
};

const QUESTION_COPY = {
  title: 'Can you remember it?',
  subtitle6to9: 'Pick the answer you placed in this station.',
  subtitle10to14: 'Type what you placed here.',
  inputPlaceholder: 'Type your answer...',
  submit: 'Check my answer',
  giveUp: 'I give up / Show me',
};

const REVEAL_COPY = {
  correctTitle: 'Great memory!',
  correctSubtitle: 'You remembered this station.',
  incorrectTitle: 'Almost!',
  nextTime: 'You will get it next time!',
  answerWas: 'The answer was...',
  nextStation: 'Next Station',
  finishReview: 'Finish Review',
};

const REVIEW_COLORS = {
  lightFallback: colors.bg,
  textDark: colors.text,
  textMuted: colors.muted,
  textSoft: colors.textSoft,
  white: colors.white,
  success: colors.success,
  successDark: colors.secondary,
  warning: colors.warning,
  warningDark: colors.text,
  orangeSoft: colors.warningSoft,
  greenSoft: colors.secondarySoft,
  defaultPalaceBackground: colors.accentSoft,
  overlayLight: colors.surfaceSoft,
  overlayDark: colors.surfaceMuted,
  overlayMedium: colors.surfaceSoft,
  overlayStrong: colors.surface,
  overlayBubble: colors.surface,
  progressTrack: colors.surfaceMuted,
  subtleStroke: colors.border,
  strongStroke: colors.white,
  inputPlaceholder: colors.muted,
  iconTileSurface: colors.surfaceSoft,
};

const PLACEHOLDER_OPTIONS = [
  'A magic key',
  'A golden star',
  'A tiny dragon',
  'A secret map',
  'A blue book',
  'A bright lantern',
  'A silver crown',
  'A hidden treasure',
];

const CONFETTI_COLORS = [
  colors.success,
  colors.primary,
  colors.accent,
  colors.emphasis,
  colors.secondary,
  colors.warning,
];

const CONFETTI_PIECES = Array.from({ length: 28 }).map((_, index) => ({
  id: index,
  left: (index * 37) % 100,
  delay: (index % 7) * 90,
  size: 7 + (index % 4) * 3,
  rotate: index % 2 === 0 ? 160 : -160,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

const PERFECT_SCORE_PERCENTAGE = 1;
const SUMMARY_COUNTER_DURATION_MS = 900;
const COMPACT_REVIEW_HEIGHT_THRESHOLD = 750;

const REVIEW_DIMENSIONS = {
  introGuide: 210,
  introGuideCompact: 112,
  walkingGuide: 104,
  walkingGuideCompact: 76,
} as const;

const REVIEW_FONT_SIZES = {
  errorEmoji: 56,
  palaceEmoji: 104,
  palaceEmojiCompact: 72,
  introHeading: 34,
  introHeadingCompact: 28,
  stationEmojiLarge: 86,
  stationEmojiMedium: 58,
  checkmark: 72,
  almostEmoji: 46,
  completeEmoji: 82,
} as const;

const REVIEW_RADII = {
  stationTileLarge: 42,
} as const;

const CORRECT_SOUND_SOURCE = require('../../assets/sounds/review-correct.wav');
const INCORRECT_SOUND_SOURCE = require('../../assets/sounds/review-incorrect.wav');

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const parseHexColor = (hex: string) => {
  if (!hex.startsWith('#')) return null;

  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) return null;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some(Number.isNaN)) return null;

  return { r, g, b };
};

const toHex = (value: number) => value.toString(16).padStart(2, '0');

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;

  const max = Math.max(normalizedR, normalizedG, normalizedB);
  const min = Math.min(normalizedR, normalizedG, normalizedB);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;

    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case normalizedR:
        h =
          (normalizedG - normalizedB) / delta +
          (normalizedG < normalizedB ? 6 : 0);
        break;

      case normalizedG:
        h = (normalizedB - normalizedR) / delta + 2;
        break;

      case normalizedB:
        h = (normalizedR - normalizedG) / delta + 4;
        break;

      default:
        h = 0;
    }

    h /= 6;
  }

  return { h, s, l };
};

const hueToRgb = (p: number, q: number, t: number) => {
  let adjustedT = t;

  if (adjustedT < 0) adjustedT += 1;
  if (adjustedT > 1) adjustedT -= 1;

  if (adjustedT < 1 / 6) return p + (q - p) * 6 * adjustedT;
  if (adjustedT < 1 / 2) return q;
  if (adjustedT < 2 / 3) return p + (q - p) * (2 / 3 - adjustedT) * 6;

  return p;
};

const hslToHex = ({ h, s, l }: { h: number; s: number; l: number }) => {
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = l;
    g = l;
    b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return `#${toHex(Math.round(r * 255))}${toHex(
    Math.round(g * 255),
  )}${toHex(Math.round(b * 255))}`;
};

const intensifyPastelHex = (hex: string): string => {
  const rgb = parseHexColor(hex);

  if (!rgb) {
    return REVIEW_COLORS.success;
  }

  const { h, s } = rgbToHsl(rgb);

  return hslToHex({
    h,
    s: clamp(Math.max(s * 1.8, 0.78), 0.78, 0.95),
    l: 0.42,
  });
};

const getReadableTextColor = (backgroundColor: string): string => {
  const fallbackColor = REVIEW_COLORS.textSoft;
  const rgb = parseHexColor(backgroundColor);

  if (!rgb) return fallbackColor;

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  return brightness > 150 ? REVIEW_COLORS.textDark : REVIEW_COLORS.white;
};

const getSoftOverlayColor = (textColor: string): string => {
  return textColor === REVIEW_COLORS.white
    ? REVIEW_COLORS.overlayDark
    : REVIEW_COLORS.overlayLight;
};

const getProgressLabel = (
  currentIndex: number,
  totalStations: number,
): string => {
  return `${currentIndex + 1} / ${totalStations}`;
};

const getStarRating = (correctAnswers: number, totalStations: number): string => {
  if (totalStations <= 0) {
    return '☆☆☆☆☆';
  }

  const ratio = correctAnswers / totalStations;
  const filledStars = Math.max(1, Math.round(ratio * 5));
  const emptyStars = 5 - filledStars;

  return `${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}`;
};

const getStationAnswer = (station: ReviewScreenStation): string => {
  return station.answerText?.trim() || station.name;
};

const normalizeAnswer = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: b.length + 1 }, (_, rowIndex) =>
    Array.from({ length: a.length + 1 }, (_, columnIndex) => {
      if (rowIndex === 0) return columnIndex;
      if (columnIndex === 0) return rowIndex;
      return 0;
    }),
  );

  for (let rowIndex = 1; rowIndex <= b.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= a.length; columnIndex += 1) {
      if (b.charAt(rowIndex - 1) === a.charAt(columnIndex - 1)) {
        matrix[rowIndex][columnIndex] = matrix[rowIndex - 1][columnIndex - 1];
      } else {
        matrix[rowIndex][columnIndex] = Math.min(
          matrix[rowIndex - 1][columnIndex - 1] + 1,
          matrix[rowIndex][columnIndex - 1] + 1,
          matrix[rowIndex - 1][columnIndex] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const isFreeTextAnswerCorrect = (input: string, expected: string): boolean => {
  const normalizedInput = normalizeAnswer(input);
  const normalizedExpected = normalizeAnswer(expected);

  if (!normalizedInput || !normalizedExpected) {
    return false;
  }

  if (normalizedInput === normalizedExpected) {
    return true;
  }

  if (
    normalizedExpected.length >= 4 &&
    normalizedInput.length >= 4 &&
    (normalizedInput.includes(normalizedExpected) ||
      normalizedExpected.includes(normalizedInput))
  ) {
    return true;
  }

  const distance = getLevenshteinDistance(normalizedInput, normalizedExpected);
  const longestLength = Math.max(
    normalizedInput.length,
    normalizedExpected.length,
  );

  if (longestLength === 0) {
    return false;
  }

  const similarity = 1 - distance / longestLength;

  return similarity >= 0.82;
};

const shuffleArray = <T,>(items: T[]): T[] => {
  return [...items].sort(() => Math.random() - 0.5);
};

const createMultipleChoiceOptions = (
  currentStation: ReviewScreenStation,
  stations: ReviewScreenStation[],
): string[] => {
  const correctAnswer = getStationAnswer(currentStation);

  const wrongAnswers = stations
    .filter((station) => station.id !== currentStation.id)
    .map(getStationAnswer)
    .filter(
      (answer) => normalizeAnswer(answer) !== normalizeAnswer(correctAnswer),
    );

  const uniqueWrongAnswers = Array.from(new Set(wrongAnswers));

  const placeholders = PLACEHOLDER_OPTIONS.filter(
    (option) => normalizeAnswer(option) !== normalizeAnswer(correctAnswer),
  );

  const filledWrongAnswers = [...uniqueWrongAnswers, ...placeholders].slice(
    0,
    3,
  );

  return shuffleArray([correctAnswer, ...filledWrongAnswers]).slice(0, 4);
};


const safelyRunFeedback = async (callback: () => Promise<void>) => {
  try {
    await callback();
  } catch {
    // Feedback should never block the review flow.
  }
};

const useReviewFeedbackEffects = () => {
  const correctSoundRef = useRef<Audio.Sound | null>(null);
  const incorrectSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });

        const [correctSound, incorrectSound] = await Promise.all([
          Audio.Sound.createAsync(CORRECT_SOUND_SOURCE, {
            shouldPlay: false,
            volume: 0.82,
          }),
          Audio.Sound.createAsync(INCORRECT_SOUND_SOURCE, {
            shouldPlay: false,
            volume: 0.46,
          }),
        ]);

        if (!isMounted) {
          await Promise.all([
            correctSound.sound.unloadAsync(),
            incorrectSound.sound.unloadAsync(),
          ]);
          return;
        }

        correctSoundRef.current = correctSound.sound;
        incorrectSoundRef.current = incorrectSound.sound;
      } catch {
        // Sound effects are optional. Keep the review usable if audio fails.
      }
    };

    loadSounds();

    return () => {
      isMounted = false;

      const correctSound = correctSoundRef.current;
      const incorrectSound = incorrectSoundRef.current;

      correctSoundRef.current = null;
      incorrectSoundRef.current = null;

      if (correctSound) {
        correctSound.unloadAsync().catch(() => undefined);
      }

      if (incorrectSound) {
        incorrectSound.unloadAsync().catch(() => undefined);
      }
    };
  }, []);

  const playSound = useCallback(async (sound: Audio.Sound | null) => {
    if (!sound) return;

    try {
      await sound.stopAsync();
    } catch {
      // Some platforms throw if the sound was not playing. Safe to ignore.
    }

    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      // Sound effects should never block answer recording.
    }
  }, []);

  const playTapFeedback = useCallback(() => {
    safelyRunFeedback(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    );
  }, []);

  const playCorrectFeedback = useCallback(() => {
    safelyRunFeedback(async () => {
      await Promise.all([
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        playSound(correctSoundRef.current),
      ]);
    });
  }, [playSound]);

  const playIncorrectFeedback = useCallback(() => {
    safelyRunFeedback(async () => {
      await Promise.all([
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
        playSound(incorrectSoundRef.current),
      ]);
    });
  }, [playSound]);

  return {
    playTapFeedback,
    playCorrectFeedback,
    playIncorrectFeedback,
  };
};

const ReviewLoadingState = () => {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>{INTRO_COPY.loading}</Text>
    </SafeAreaView>
  );
};

const ReviewErrorState = ({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) => {
  return (
    <SafeAreaView style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>🧭</Text>
      <Text style={styles.errorTitle}>{INTRO_COPY.errorTitle}</Text>
      <Text style={styles.errorMessage}>{message}</Text>

      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Go back</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const ReviewPrimaryButton = ({
  label,
  backgroundColor,
  textColor,
  disabled = false,
  onPress,
}: {
  label: string;
  backgroundColor: string;
  textColor: string;
  disabled?: boolean;
  onPress: () => void;
}) => {
  return (
    <View style={styles.primaryButtonOuter}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor },
          pressed && styles.primaryButtonPressed,
          disabled && styles.primaryButtonDisabled,
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: textColor }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
};


const ReviewSecondaryButton = ({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.summarySecondaryButton,
        pressed && styles.summarySecondaryButtonPressed,
        disabled && styles.primaryButtonDisabled,
      ]}
    >
      <Text style={styles.summarySecondaryButtonText}>{label}</Text>
    </Pressable>
  );
};

const StationIconTile = ({
  emoji,
  size = 'large',
}: {
  emoji: string;
  size?: 'large' | 'medium';
}) => {
  const safeEmoji = emoji.trim().length > 0 ? emoji : '📍';

  return (
    <View
      style={[
        styles.stationIconTile,
        size === 'large'
          ? styles.stationIconTileLarge
          : styles.stationIconTileMedium,
      ]}
    >
      <View
        style={[
          styles.stationIconEmojiSurface,
          size === 'large'
            ? styles.stationIconEmojiSurfaceLarge
            : styles.stationIconEmojiSurfaceMedium,
        ]}
      >
        <Text
          style={[
            styles.stationIconEmoji,
            size === 'large'
              ? styles.stationIconEmojiLarge
              : styles.stationIconEmojiMedium,
          ]}
        >
          {safeEmoji}
        </Text>
      </View>
    </View>
  );
};

const ProgressBar = ({
  currentIndex,
  totalStations,
  textColor,
}: {
  currentIndex: number;
  totalStations: number;
  textColor: string;
}) => {
  const progress = totalStations > 0 ? (currentIndex + 1) / totalStations : 0;

  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: textColor }]}>
          Journey progress
        </Text>
        <Text style={[styles.progressValue, { color: textColor }]}>
          {getProgressLabel(currentIndex, totalStations)}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: textColor },
          ]}
        />
      </View>
    </View>
  );
};

const CountdownTimer = () => {
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const progress = remainingSeconds / 30;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    setRemainingSeconds(30);

    const intervalId = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 0) {
          clearInterval(intervalId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <View style={styles.timerWrapper}>
      <Svg width={62} height={62} viewBox="0 0 62 62">
        <Circle
          cx="31"
          cy="31"
          r={radius}
          stroke={REVIEW_COLORS.subtleStroke}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx="31"
          cy="31"
          r={radius}
          stroke={REVIEW_COLORS.textDark}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin="31,31"
        />
      </Svg>

      <Text style={styles.timerText}>{remainingSeconds}</Text>
    </View>
  );
};

const ConfettiPiece = ({
  left,
  delay,
  size,
  rotate,
  color,
}: {
  left: number;
  delay: number;
  size: number;
  rotate: number;
  color: string;
}) => {
  const progress = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 1400,
      }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateY: progress.value * screenHeight * 0.72 },
        { rotate: `${progress.value * rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: `${left}%`,
          width: size,
          height: size * 1.6,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const ConfettiOverlay = () => {
  return (
    <View pointerEvents="none" style={styles.confettiOverlay}>
      {CONFETTI_PIECES.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          left={piece.left}
          delay={piece.delay}
          size={piece.size}
          rotate={piece.rotate}
          color={piece.color}
        />
      ))}
    </View>
  );
};

const FloatingXp = () => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(-62, { duration: 1100 });
    opacity.value = withDelay(450, withTiming(0, { duration: 750 }));
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.Text style={[styles.floatingXp, animatedStyle]}>
      Great!
    </Animated.Text>
  );
};

const IntroState = ({
  data,
  textColor,
  overlayColor,
  buttonFillColor,
  buttonTextColor,
  isStarting,
  onStart,
}: {
  data: ReviewScreenData;
  textColor: string;
  overlayColor: string;
  buttonFillColor: string;
  buttonTextColor: string;
  isStarting: boolean;
  onStart: () => void;
}) => {
  const { height } = useWindowDimensions();
  const isCompactHeight = height < COMPACT_REVIEW_HEIGHT_THRESHOLD;
  const floating = useSharedValue(0);

  useEffect(() => {
    floating.value = withTiming(0);
  }, [floating]);

  const floatingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floating.value }],
    };
  });

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.introScrollContent,
          isCompactHeight && styles.introScrollContentCompact,
        ]}
      >
        <View
          style={[
            styles.introTopSection,
            isCompactHeight && styles.introTopSectionCompact,
          ]}
        >
          <Animated.View entering={BounceIn.duration(900)} style={floatingStyle}>
            <Text
              style={[
                styles.palaceEmoji,
                isCompactHeight && styles.palaceEmojiCompact,
              ]}
            >
              {data.palace.emoji}
            </Text>
          </Animated.View>

          <Text
            style={[
              styles.introHeading,
              isCompactHeight && styles.introHeadingCompact,
              { color: textColor },
            ]}
          >
            Time to visit your {data.palace.name}!
          </Text>

          <View
            style={[
              styles.stationCountPill,
              isCompactHeight && styles.stationCountPillCompact,
              { backgroundColor: overlayColor },
            ]}
          >
            <Text
              style={[
                styles.stationCountText,
                isCompactHeight && styles.stationCountTextCompact,
                { color: textColor },
              ]}
            >
              You have {data.palace.stationCount} stops on this journey
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.introGuideSection,
            isCompactHeight && styles.introGuideSectionCompact,
          ]}
        >
          <GuideLottie
            size={
              isCompactHeight
                ? REVIEW_DIMENSIONS.introGuideCompact
                : REVIEW_DIMENSIONS.introGuide
            }
            variant="forward"
          />

          {!isCompactHeight ? (
            <View style={styles.guideSpeechBubble}>
              <Text style={styles.guideSpeechBubbleText}>Follow me!</Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.introButtonSection,
            isCompactHeight && styles.introButtonSectionCompact,
          ]}
        >
          <ReviewPrimaryButton
            label={isStarting ? 'Starting...' : INTRO_COPY.startButton}
            backgroundColor={buttonFillColor}
            textColor={buttonTextColor}
            disabled={isStarting}
            onPress={onStart}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const WalkingState = ({
  station,
  currentIndex,
  totalStations,
  textColor,
  buttonFillColor,
  buttonTextColor,
  onRemember,
}: {
  station: ReviewScreenStation;
  currentIndex: number;
  totalStations: number;
  textColor: string;
  buttonFillColor: string;
  buttonTextColor: string;
  onRemember: () => void;
}) => {
  const { height } = useWindowDimensions();
  const isCompactHeight = height < COMPACT_REVIEW_HEIGHT_THRESHOLD;

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.walkingScrollContent,
          isCompactHeight && styles.walkingScrollContentCompact,
        ]}
      >
        <ProgressBar
          currentIndex={currentIndex}
          totalStations={totalStations}
          textColor={textColor}
        />

        <View
          style={[
            styles.walkingContent,
            isCompactHeight && styles.walkingContentCompact,
          ]}
        >
          <Animated.View
            key={station.id}
            entering={SlideInRight.springify().damping(14).mass(0.8)}
          >
            <StationIconTile
              emoji={station.emoji}
              size={isCompactHeight ? 'medium' : 'large'}
            />
          </Animated.View>

          <Text
            style={[
              styles.stationName,
              isCompactHeight && styles.stationNameCompact,
              { color: textColor },
            ]}
          >
            {station.name}
          </Text>

          <Text
            style={[
              styles.walkingPrompt,
              isCompactHeight && styles.walkingPromptCompact,
              { color: textColor },
            ]}
          >
            {WALKING_COPY.prompt}
          </Text>
        </View>

        <View
          style={[
            styles.walkingGuideSection,
            isCompactHeight && styles.walkingGuideSectionCompact,
          ]}
        >
          <GuideLottie
            size={
              isCompactHeight
                ? REVIEW_DIMENSIONS.walkingGuideCompact
                : REVIEW_DIMENSIONS.walkingGuide
            }
            variant="pointing"
          />

          <View style={styles.guideSpeechBubble}>
            <Text style={styles.guideSpeechBubbleText}>Take your time.</Text>
          </View>
        </View>

        <View
          style={[
            styles.walkingButtonSection,
            isCompactHeight && styles.walkingButtonSectionCompact,
          ]}
        >
          <ReviewPrimaryButton
            label={WALKING_COPY.rememberButton}
            backgroundColor={buttonFillColor}
            textColor={buttonTextColor}
            onPress={onRemember}
          />
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const QuestionState = ({
  station,
  stations,
  ageGroup,
  textColor,
  overlayColor,
  buttonFillColor,
  buttonTextColor,
  answerBorderColor,
  answerButtonBackgroundColor,
  isSubmittingAnswer,
  onAnswerSelectionFeedback,
  onSubmitAnswer,
  onGiveUp,
}: {
  station: ReviewScreenStation;
  stations: ReviewScreenStation[];
  ageGroup: ReviewAgeGroup;
  textColor: string;
  overlayColor: string;
  buttonFillColor: string;
  buttonTextColor: string;
  answerBorderColor: string;
  answerButtonBackgroundColor: string;
  isSubmittingAnswer: boolean;
  onAnswerSelectionFeedback: () => void;
  onSubmitAnswer: (answer: string) => void;
  onGiveUp: () => void;
}) => {
  const [freeTextAnswer, setFreeTextAnswer] = useState('');

  const options = useMemo(() => {
    return createMultipleChoiceOptions(station, stations);
  }, [station, stations]);

  const canSubmitFreeText = freeTextAnswer.trim().length > 0 && !isSubmittingAnswer;

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <View style={styles.questionHeader}>
        <Text style={[styles.questionTitle, { color: textColor }]}>
          {QUESTION_COPY.title}
        </Text>

        <Text style={[styles.questionSubtitle, { color: textColor }]}>
          {ageGroup === '6-9'
            ? QUESTION_COPY.subtitle6to9
            : QUESTION_COPY.subtitle10to14}
        </Text>
      </View>

      <View style={[styles.questionCard, { backgroundColor: overlayColor }]}> 
        <StationIconTile emoji={station.emoji} size="medium" />

        <Text style={[styles.questionStationName, { color: textColor }]}> 
          {station.name}
        </Text>

        {ageGroup === '10-14' && (
          <View style={styles.timerSection}>
            <CountdownTimer />
            <Text style={styles.timerHint}>No pressure. Just focus.</Text>
          </View>
        )}
      </View>

      {ageGroup === '6-9' ? (
        <View style={styles.optionsGrid}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              activeOpacity={0.84}
              disabled={isSubmittingAnswer}
              onPress={() => {
                onAnswerSelectionFeedback();
                onSubmitAnswer(option);
              }}
              style={[
                styles.optionButton,
                {
                  borderColor: answerBorderColor,
                  backgroundColor: answerButtonBackgroundColor,
                },
                isSubmittingAnswer && styles.primaryButtonDisabled,
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.76}
                style={styles.optionButtonText}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.freeTextSection}>
          <TextInput
            value={freeTextAnswer}
            onChangeText={setFreeTextAnswer}
            placeholder={QUESTION_COPY.inputPlaceholder}
            placeholderTextColor={REVIEW_COLORS.inputPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmittingAnswer}
            style={[
              styles.answerInput,
              {
                borderColor: answerBorderColor,
                backgroundColor: REVIEW_COLORS.iconTileSurface,
              },
            ]}
          />

          <ReviewPrimaryButton
            label={isSubmittingAnswer ? 'Checking...' : QUESTION_COPY.submit}
            backgroundColor={buttonFillColor}
            textColor={buttonTextColor}
            disabled={!canSubmitFreeText || isSubmittingAnswer}
            onPress={() => {
              onAnswerSelectionFeedback();
              onSubmitAnswer(freeTextAnswer);
            }}
          />
        </View>
      )}

      <Pressable
        disabled={isSubmittingAnswer}
        style={[
          styles.giveUpButton,
          isSubmittingAnswer && styles.primaryButtonDisabled,
        ]}
        onPress={onGiveUp}
      >
        <Text style={styles.giveUpButtonText}>{QUESTION_COPY.giveUp}</Text>
      </Pressable>
    </Animated.View>
  );
};

const RevealState = ({
  result,
  isLastStation,
  isCompleting,
  buttonFillColor,
  buttonTextColor,
  onNext,
}: {
  result: RevealResult;
  isLastStation: boolean;
  isCompleting: boolean;
  buttonFillColor: string;
  buttonTextColor: string;
  onNext: () => void;
}) => {
  if (result.correct) {
    return (
      <Animated.View
        entering={FadeIn.duration(350)}
        style={styles.stateContainer}
      >
        <ConfettiOverlay />

        <View style={styles.correctRevealContent}>
          <Animated.View
            entering={BounceIn.duration(900)}
            style={styles.checkmarkCircle}
          >
            <Text style={styles.checkmarkText}>✓</Text>
          </Animated.View>

          <FloatingXp />

          <Text style={styles.correctRevealTitle}>
            {REVEAL_COPY.correctTitle}
          </Text>
          <Text style={styles.correctRevealSubtitle}>
            {REVEAL_COPY.correctSubtitle}
          </Text>

          <GuideLottie size={170} variant="happy" />
        </View>

        <View style={styles.revealButtonSection}>
          <ReviewPrimaryButton
            label={
              isCompleting
                ? 'Finishing...'
                : isLastStation
                  ? REVEAL_COPY.finishReview
                  : REVEAL_COPY.nextStation
            }
            backgroundColor={buttonFillColor}
            textColor={buttonTextColor}
            disabled={isCompleting}
            onPress={onNext}
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <View style={styles.incorrectRevealContent}>
        <View style={styles.almostCard}>
          <Text style={styles.almostEmoji}>🌟</Text>
          <Text style={styles.almostTitle}>{REVEAL_COPY.incorrectTitle}</Text>

          <Text style={styles.almostMessage}>
            {result.gaveUp
              ? 'Good choice asking for help.'
              : 'That was close. You are still learning this station.'}
          </Text>

          <Text style={styles.answerWas}>{REVEAL_COPY.answerWas}</Text>
          <Text style={styles.correctAnswerText}>{result.correctAnswer}</Text>
        </View>

        <View style={styles.encouragementRow}>
          <GuideLottie size={120} variant="thinking" />

          <View style={styles.encouragementBubble}>
            <Text style={styles.encouragementBubbleText}>
              {REVEAL_COPY.nextTime}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.revealButtonSection}>
        <ReviewPrimaryButton
          label={
            isCompleting
              ? 'Finishing...'
              : isLastStation
                ? REVEAL_COPY.finishReview
                : REVEAL_COPY.nextStation
          }
          backgroundColor={buttonFillColor}
          textColor={buttonTextColor}
          disabled={isCompleting}
          onPress={onNext}
        />
      </View>
    </Animated.View>
  );
};


const FireworksLayer = () => {
  return (
    <View pointerEvents="none" style={styles.fireworksLayer}>
      <LottieView
        source={require('../../assets/animations/review-fireworks.json')}
        autoPlay
        loop
        style={styles.fireworksAnimation}
      />
    </View>
  );
};

const AnimatedXpCounter = ({ targetValue }: { targetValue: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (targetValue <= 0) {
      setDisplayValue(0);
      return undefined;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SUMMARY_COUNTER_DURATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(targetValue * easedProgress));

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 16);

    return () => {
      clearInterval(interval);
    };
  }, [targetValue]);

  return <Text style={styles.completeXpText}>+{displayValue} XP</Text>;
};

const SparkleDot = ({
  delay,
  left,
  top,
  size,
}: {
  delay: number;
  left: number;
  top: number;
  size: number;
}) => {
  const opacity = useSharedValue(0.45);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    scale.value = withDelay(delay, withTiming(1.25, { duration: 420 }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text
      style={[
        styles.perfectSparkle,
        {
          left,
          top,
          fontSize: size,
        },
        animatedStyle,
      ]}
    >
      ✦
    </Animated.Text>
  );
};

const PerfectMemoryBadge = () => {
  return (
    <View style={styles.perfectBadgeWrapper}>
      <SparkleDot delay={0} left={10} top={-10} size={22} />
      <SparkleDot delay={120} left={230} top={0} size={18} />
      <SparkleDot delay={220} left={40} top={50} size={16} />
      <SparkleDot delay={320} left={210} top={52} size={20} />

      <Animated.View entering={BounceIn.duration(900)} style={styles.perfectBadge}>
        <Text style={styles.perfectBadgeIcon}>✨</Text>
        <Text style={styles.perfectBadgeText}>Perfect Memory!</Text>
      </Animated.View>
    </View>
  );
};

const CompleteState = ({
  correctAnswers,
  totalStations,
  xpEarned,
  buttonFillColor,
  buttonTextColor,
  isRestarting,
  onReviewAgain,
  onBack,
}: {
  correctAnswers: number;
  totalStations: number;
  xpEarned: number;
  buttonFillColor: string;
  buttonTextColor: string;
  isRestarting: boolean;
  onReviewAgain: () => void;
  onBack: () => void;
}) => {
  const isPerfect =
    totalStations > 0 && correctAnswers / totalStations === PERFECT_SCORE_PERCENTAGE;
  const starRating = getStarRating(correctAnswers, totalStations);
  const scoreLabel = `${correctAnswers}/${totalStations} correct`;

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.completeScreen}>
      <FireworksLayer />

      <View style={styles.completeContent}>
        {isPerfect ? <PerfectMemoryBadge /> : null}

        <Animated.Text entering={BounceIn.duration(850)} style={styles.completeEmoji}>
          {isPerfect ? '🏆' : '🌟'}
        </Animated.Text>

        <Text style={styles.completeTitle}>Memory walk complete!</Text>

        <GuideLottie size={120} variant="happy" />

        <View style={styles.completeScoreCard}>
          <Text style={styles.completeScoreLabel}>{scoreLabel}</Text>
          <Text style={styles.completeStars}>{starRating}</Text>
          <Text style={styles.completeScoreHint}>
            {isPerfect
              ? 'Every station was remembered perfectly.'
              : 'Every review makes your palace stronger.'}
          </Text>
        </View>

        <View style={styles.completeXpCard}>
          <Text style={styles.completeXpLabel}>XP earned this session</Text>
          <AnimatedXpCounter targetValue={xpEarned} />
        </View>
      </View>

      <View style={styles.completeButtonStack}>
        <ReviewPrimaryButton
          label={isRestarting ? 'Starting...' : 'Review Again'}
          backgroundColor={buttonFillColor}
          textColor={buttonTextColor}
          disabled={isRestarting}
          onPress={onReviewAgain}
        />

        <ReviewSecondaryButton
          label="Back to Palace"
          disabled={isRestarting}
          onPress={onBack}
        />
      </View>
    </Animated.View>
  );
};

export const ReviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ReviewRouteParams, 'Review'>>();

  const {
    palaceId,
    initialPalace,
    initialStations,
    ageGroup: routeAgeGroup,
  } = route.params;

  const userId = useUserStore(selectAuthUserId);
  const profileAgeGroup = useUserStore((state) => state.profile?.ageGroup);
  const triggerConfetti = useConfettiStore((state) => state.triggerConfetti);

  const effectiveAgeGroup = useMemo<ReviewAgeGroup>(() => {
    return normalizeAgeGroup(routeAgeGroup ?? profileAgeGroup);
  }, [profileAgeGroup, routeAgeGroup]);

  const {
    playTapFeedback,
    playCorrectFeedback,
    playIncorrectFeedback,
  } = useReviewFeedbackEffects();

  const [data, setData] = useState<ReviewScreenData | null>(null);
  const [screenState, setScreenState] = useState<ReviewScreenState>('INTRO');
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [revealResult, setRevealResult] = useState<RevealResult | null>(null);
  const [answeredResults, setAnsweredResults] = useState<RevealResult[]>([]);
  const [completedSession, setCompletedSession] = useState<ReviewSession | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isStartingRef = useRef(false);
  const isSubmittingAnswerRef = useRef(false);
  const isCompletingRef = useRef(false);
  const isAdvancingStationRef = useRef(false);

  const shouldConfirmQuitReview = Boolean(sessionId && screenState !== 'COMPLETE');

  usePreventRemove(shouldConfirmQuitReview, ({ data: preventRemoveData }) => {
    Alert.alert(
      'Quit review?',
      'Are you sure you want to quit? Your current review progress will be lost.',
      [
        {
          text: 'Stay',
          style: 'cancel',
        },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => navigation.dispatch(preventRemoveData.action),
        },
      ],
    );
  });

  useEffect(() => {
    navigation.setOptions?.({
      gestureEnabled: !shouldConfirmQuitReview,
    });
  }, [navigation, shouldConfirmQuitReview]);

  useEffect(() => {
    let isMounted = true;

    const loadReviewData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        if (initialPalace && initialStations) {
          setData({
            palace: initialPalace,
            stations: [...initialStations].sort((a, b) => a.order - b.order),
          });

          setIsLoading(false);
          return;
        }

        const reviewData = await getReviewScreenData(palaceId);

        if (!isMounted) return;

        setData(reviewData);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : 'The review data could not be loaded.';

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReviewData();

    return () => {
      isMounted = false;
    };
  }, [initialPalace, initialStations, palaceId]);

  const palaceBackgroundColor =
    data?.palace.backgroundColor ?? REVIEW_COLORS.defaultPalaceBackground;

  const textColor = useMemo(() => {
    return getReadableTextColor(palaceBackgroundColor);
  }, [palaceBackgroundColor]);

  const overlayColor = useMemo(() => {
    return getSoftOverlayColor(textColor);
  }, [textColor]);

  const buttonFillColor = useMemo(() => {
    return intensifyPastelHex(palaceBackgroundColor);
  }, [palaceBackgroundColor]);

  const answerBorderColor = useMemo(() => {
    return intensifyPastelHex(palaceBackgroundColor);
  }, [palaceBackgroundColor]);

  const buttonTextColor = REVIEW_COLORS.white;

  const currentStation = data?.stations[currentStationIndex] ?? null;
  const isLastStation = Boolean(
    data && currentStationIndex >= data.stations.length - 1,
  );

  const correctAnswers = answeredResults.filter((result) => result.correct)
    .length;
  const totalStations = data?.stations.length ?? 0;
  const fallbackXpEarned = (() => {
    const hasCompletedAllStations =
      totalStations > 0 && answeredResults.length >= totalStations;

    if (!hasCompletedAllStations) {
      return 0;
    }

    const isPerfectReview = correctAnswers === totalStations;

    return (
      XP_REWARDS.COMPLETE_REVIEW +
      (isPerfectReview ? XP_REWARDS.PERFECT_REVIEW : 0)
    );
  })();

  const handleStartJourney = async () => {
    if (!data || isStartingRef.current) return;

    if (data.stations.length < 2) {
      Alert.alert('Not enough stations', INTRO_COPY.notEnoughStations);
      return;
    }

    const activeUserId = userId;

    if (!activeUserId) {
      Alert.alert(
        'Session unavailable',
        'You need to be logged in before starting a review.',
      );
      return;
    }

    try {
      isStartingRef.current = true;
      setIsStarting(true);

      const session = await startReview({
        palaceId: data.palace.id,
        userId: activeUserId,
        totalStations: data.stations.length,
      });

      setSessionId(session.id);
      setCurrentStationIndex(0);
      setAnsweredResults([]);
      setRevealResult(null);
      setCompletedSession(null);
      setScreenState('WALKING');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The review session could not be started.';

      Alert.alert('Could not start review', message);
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  };

  const handleRemember = () => {
    if (isSubmittingAnswerRef.current || isCompletingRef.current) {
      return;
    }

    if (!sessionId) {
      Alert.alert(
        'Review session missing',
        'The review session was not created correctly.',
      );
      return;
    }

    setScreenState('QUESTION');
  };

  const handleSubmitAnswer = async (answer: string, gaveUp = false) => {
    if (
      !data ||
      !currentStation ||
      !sessionId ||
      isSubmittingAnswer ||
      isSubmittingAnswerRef.current
    ) {
      return;
    }

    const activeUserId = userId;

    if (!activeUserId) {
      Alert.alert(
        'Session unavailable',
        'You need to be logged in to record this answer.',
      );
      return;
    }

    isSubmittingAnswerRef.current = true;

    const correctAnswer = getStationAnswer(currentStation);

    const correct = gaveUp
      ? false
      : effectiveAgeGroup === '6-9'
        ? normalizeAnswer(answer) === normalizeAnswer(correctAnswer)
        : isFreeTextAnswerCorrect(answer, correctAnswer);

    if (correct) {
      playCorrectFeedback();
    } else {
      playIncorrectFeedback();
    }

    const result: RevealResult = {
      stationId: currentStation.id,
      correct,
      correctAnswer,
      chosenAnswer: answer || null,
      gaveUp,
    };

    try {
      setIsSubmittingAnswer(true);

      await recordAnswer({
        userId: activeUserId,
        palaceId: data.palace.id,
        sessionId,
        stationId: currentStation.id,
        correct,
      });

      setAnsweredResults((currentResults) => {
        const withoutCurrentStation = currentResults.filter(
          (item) => item.stationId !== currentStation.id,
        );

        return [...withoutCurrentStation, result];
      });

      setRevealResult(result);
      setScreenState('REVEAL');
    } catch (error) {
      console.error('[ReviewScreen] recordAnswer failed:', error);
      console.error('[ReviewScreen] recordAnswer payload:', {
        userId: activeUserId,
        palaceId: data.palace.id,
        sessionId,
        stationId: currentStation.id,
        stationLabel: currentStation.name,
        correct,
      });

      const message =
        error instanceof Error
          ? error.message
          : 'The answer could not be recorded.';

      Alert.alert('Could not record answer', message);
    } finally {
      isSubmittingAnswerRef.current = false;
      setIsSubmittingAnswer(false);
    }
  };

  const handleGiveUp = () => {
    if (isSubmittingAnswerRef.current) {
      return;
    }

    playTapFeedback();
    void handleSubmitAnswer('', true);
  };

  const handleNextStation = async () => {
    if (!data || !sessionId || isAdvancingStationRef.current) return;

    isAdvancingStationRef.current = true;

    if (!isLastStation) {
      setRevealResult(null);
      setCurrentStationIndex((current) => current + 1);
      setScreenState('WALKING');

      setTimeout(() => {
        isAdvancingStationRef.current = false;
      }, 250);
      return;
    }

    if (isCompletingRef.current) {
      isAdvancingStationRef.current = false;
      return;
    }

    const activeUserId = userId;

    if (!activeUserId) {
      isAdvancingStationRef.current = false;
      Alert.alert(
        'Session unavailable',
        'You need to be logged in to complete this review.',
      );
      return;
    }

    try {
      isCompletingRef.current = true;
      setIsCompleting(true);

      const completed = await completeReview({
        userId: activeUserId,
        palaceId: data.palace.id,
        sessionId,
      });

      triggerConfetti();
      setCompletedSession(completed);
      setScreenState('COMPLETE');
    } catch (error) {
      console.error('[ReviewScreen] completeReview failed:', error);
      console.error('[ReviewScreen] completeReview payload:', {
        userId: activeUserId,
        palaceId: data.palace.id,
        sessionId,
        answeredResults,
        totalStations: data.stations.length,
      });

      const message =
        error instanceof Error
          ? error.message
          : 'The review could not be completed.';

      Alert.alert('Could not complete review', message);
    } finally {
      isCompletingRef.current = false;
      isAdvancingStationRef.current = false;
      setIsCompleting(false);
    }
  };

  const handleReviewAgain = async () => {
    if (isStartingRef.current) {
      return;
    }

    setSessionId(null);
    setCurrentStationIndex(0);
    setRevealResult(null);
    setAnsweredResults([]);
    setCompletedSession(null);

    await handleStartJourney();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <ReviewLoadingState />;
  }

  if (errorMessage || !data) {
    return (
      <ReviewErrorState
        message={errorMessage ?? 'The review data could not be loaded.'}
        onBack={handleGoBack}
      />
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: data.palace.backgroundColor },
      ]}
    >
      {screenState === 'INTRO' && (
        <IntroState
          data={data}
          textColor={textColor}
          overlayColor={overlayColor}
          buttonFillColor={buttonFillColor}
          buttonTextColor={buttonTextColor}
          isStarting={isStarting}
          onStart={handleStartJourney}
        />
      )}

      {screenState === 'WALKING' && currentStation && (
        <WalkingState
          station={currentStation}
          currentIndex={currentStationIndex}
          totalStations={data.stations.length}
          textColor={textColor}
          buttonFillColor={buttonFillColor}
          buttonTextColor={buttonTextColor}
          onRemember={handleRemember}
        />
      )}

      {screenState === 'QUESTION' && currentStation && (
        <QuestionState
          station={currentStation}
          stations={data.stations}
          ageGroup={effectiveAgeGroup}
          textColor={textColor}
          overlayColor={overlayColor}
          buttonFillColor={buttonFillColor}
          buttonTextColor={buttonTextColor}
          answerBorderColor={answerBorderColor}
          answerButtonBackgroundColor={palaceBackgroundColor}
          isSubmittingAnswer={isSubmittingAnswer}
          onAnswerSelectionFeedback={playTapFeedback}
          onSubmitAnswer={(answer) => handleSubmitAnswer(answer)}
          onGiveUp={handleGiveUp}
        />
      )}

      {screenState === 'REVEAL' && revealResult && (
        <RevealState
          result={revealResult}
          isLastStation={isLastStation}
          isCompleting={isCompleting}
          buttonFillColor={buttonFillColor}
          buttonTextColor={buttonTextColor}
          onNext={handleNextStation}
        />
      )}

      {screenState === 'COMPLETE' && (
        <CompleteState
          correctAnswers={correctAnswers}
          totalStations={totalStations}
          xpEarned={completedSession?.xpEarned ?? fallbackXpEarned}
          buttonFillColor={buttonFillColor}
          buttonTextColor={buttonTextColor}
          isRestarting={isStarting}
          onReviewAgain={handleReviewAgain}
          onBack={handleGoBack}
        />
      )}
    </SafeAreaView>
  );
};

export default ReviewScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  stateContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: REVIEW_COLORS.lightFallback,
  },

  loadingText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: REVIEW_COLORS.textSoft,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: REVIEW_COLORS.lightFallback,
  },

  errorEmoji: {
    fontSize: REVIEW_FONT_SIZES.errorEmoji,
  },

  errorTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: REVIEW_COLORS.textMuted,
    textAlign: 'center',
  },

  introScrollContent: {
    flexGrow: 1,
  },

  introScrollContentCompact: {
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },

  introTopSection: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },

  introTopSectionCompact: {
    gap: spacing.sm,
    marginTop: spacing.none,
  },

  palaceEmoji: {
    fontSize: REVIEW_FONT_SIZES.palaceEmoji,
    textAlign: 'center',
  },

  palaceEmojiCompact: {
    fontSize: REVIEW_FONT_SIZES.palaceEmojiCompact,
    lineHeight: 82,
  },

  introHeading: {
    fontSize: REVIEW_FONT_SIZES.introHeading,
    lineHeight: 40,
    fontWeight: '900',
    textAlign: 'center',
  },

  introHeadingCompact: {
    fontSize: REVIEW_FONT_SIZES.introHeadingCompact,
    lineHeight: 34,
  },

  stationCountPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radiusTokens.pill,
  },

  stationCountPillCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  stationCountText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    textAlign: 'center',
  },

  stationCountTextCompact: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },

  introGuideSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },

  introGuideSectionCompact: {
    marginTop: spacing.sm,
  },

  walkingGuideSection: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  walkingGuideSectionCompact: {
    marginTop: spacing.sm,
  },

  guideSpeechBubble: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radiusTokens.xl,
    backgroundColor: REVIEW_COLORS.overlayBubble,
    borderWidth: 2,
    borderColor: REVIEW_COLORS.subtleStroke,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  guideSpeechBubbleText: {
    fontSize: fontSizes.sm,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
    textAlign: 'center',
  },

  introButtonSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  introButtonSectionCompact: {
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  walkingButtonSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  walkingButtonSectionCompact: {
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  primaryButtonOuter: {
    width: '86%',
    maxWidth: 340,
    borderRadius: radiusTokens.xxl,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.white,
    backgroundColor: 'transparent',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },

  primaryButton: {
    width: '100%',
    minHeight: 64,
    borderRadius: radiusTokens.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  primaryButtonText: {
    fontSize: fontSizes.lg,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  primaryButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },

  primaryButtonDisabled: {
    opacity: 0.62,
  },

  secondaryButton: {
    minHeight: 56,
    borderRadius: radiusTokens.xl,
    borderWidth: 2,
    borderColor: REVIEW_COLORS.textDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: REVIEW_COLORS.overlayLight,
  },

  secondaryButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
  },

  progressWrapper: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressLabel: {
    fontSize: fontSizes.md,
    fontWeight: '900',
  },

  progressValue: {
    fontSize: fontSizes.md,
    fontWeight: '900',
  },

  progressTrack: {
    height: 16,
    borderRadius: radiusTokens.pill,
    backgroundColor: REVIEW_COLORS.progressTrack,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: radiusTokens.pill,
  },

  walkingScrollContent: {
    flexGrow: 1,
  },

  walkingScrollContentCompact: {
    justifyContent: 'space-between',
  },

  walkingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  walkingContentCompact: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  // TILE EXTERIOR
  stationIconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVIEW_COLORS.iconTileSurface,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.strongStroke,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 18,
    elevation: 5,
  },

  stationIconTileLarge: {
    width: 170,
    height: 170,
    borderRadius: REVIEW_RADII.stationTileLarge,
  },

  stationIconTileMedium: {
    width: 112,
    height: 112,
    borderRadius: radiusTokens.xxl,
    marginBottom: spacing.md,
  },

  // SUPERFICIE INTERIOR
  // Misma base de color que el tile para eliminar cualquier diferencia visual
  stationIconEmojiSurface: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVIEW_COLORS.iconTileSurface,
  },

  stationIconEmojiSurfaceLarge: {
    width: 122,
    height: 122,
    borderRadius: radiusTokens.xl,
  },

  stationIconEmojiSurfaceMedium: {
    width: 78,
    height: 78,
    borderRadius: radiusTokens.lg,
  },

  stationIconEmoji: {
    backgroundColor: REVIEW_COLORS.iconTileSurface,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  stationIconEmojiLarge: {
    fontSize: REVIEW_FONT_SIZES.stationEmojiLarge,
    lineHeight: 104,
  },

  stationIconEmojiMedium: {
    fontSize: REVIEW_FONT_SIZES.stationEmojiMedium,
    lineHeight: 72,
  },

  stationName: {
    fontSize: fontSizes.display,
    lineHeight: 40,
    fontWeight: '900',
    textAlign: 'center',
  },

  stationNameCompact: {
    fontSize: fontSizes.xxl,
    lineHeight: 34,
  },

  walkingPrompt: {
    fontSize: fontSizes.xl,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  walkingPromptCompact: {
    fontSize: fontSizes.lg,
    lineHeight: 26,
  },

  questionHeader: {
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },

  questionTitle: {
    fontSize: fontSizes.xxl,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },

  questionSubtitle: {
    maxWidth: 320,
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.72,
  },

  questionCard: {
    marginTop: spacing.xl,
    borderRadius: radiusTokens.xs,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: REVIEW_COLORS.subtleStroke,
  },

  questionStationName: {
    fontSize: fontSizes.xl,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  timerSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },

  timerWrapper: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timerText: {
    position: 'absolute',
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },

  timerHint: {
    color: REVIEW_COLORS.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },

  optionsGrid: {
    width: '100%',
    marginTop: spacing.xs,
    gap: spacing.md,
    alignItems: 'center',
  },

  optionButton: {
    width: '84%',
    height: 50,
    borderRadius: radiusTokens.xl,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 3,
  },

  optionButtonPressed: {
    opacity: 0.86,
  },

  optionButtonText: {
    width: '100%',
    color: REVIEW_COLORS.white,
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  freeTextSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },

  answerInput: {
    width: '100%',
    minHeight: 58,
    borderRadius: radiusTokens.xl,
    paddingHorizontal: spacing.lg,
    color: REVIEW_COLORS.textDark,
    borderWidth: 3,
    fontSize: fontSizes.md,
    fontWeight: '800',
  },

  giveUpButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radiusTokens.pill,
    backgroundColor: REVIEW_COLORS.overlayMedium,
  },

  giveUpButtonText: {
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.sm,
    fontWeight: '900',
    opacity: 0.78,
  },

  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  confettiPiece: {
    position: 'absolute',
    top: -28,
    borderRadius: radiusTokens.xs,
  },

  correctRevealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },

  checkmarkCircle: {
    width: 118,
    height: 118,
    borderRadius: radiusTokens.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVIEW_COLORS.success,
    borderWidth: 5,
    borderColor: REVIEW_COLORS.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },

  checkmarkText: {
    color: REVIEW_COLORS.white,
    fontSize: REVIEW_FONT_SIZES.checkmark,
    lineHeight: 78,
    fontWeight: '900',
  },

  floatingXp: {
    color: REVIEW_COLORS.successDark,
    fontSize: fontSizes.xxl,
    lineHeight: 38,
    fontWeight: '900',
  },

  correctRevealTitle: {
    color: REVIEW_COLORS.textDark,
    fontSize: REVIEW_FONT_SIZES.introHeading,
    lineHeight: 40,
    fontWeight: '900',
    textAlign: 'center',
  },

  correctRevealSubtitle: {
    color: REVIEW_COLORS.textMuted,
    fontSize: fontSizes.md,
    lineHeight: 23,
    fontWeight: '800',
    textAlign: 'center',
  },

  revealButtonSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  incorrectRevealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },

  almostCard: {
    width: '100%',
    borderRadius: radiusTokens.xxl,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: REVIEW_COLORS.orangeSoft,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.warning,
  },

  almostEmoji: {
    fontSize: REVIEW_FONT_SIZES.almostEmoji,
    marginBottom: spacing.sm,
  },

  almostTitle: {
    color: REVIEW_COLORS.warningDark,
    fontSize: fontSizes.xxl,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },

  almostMessage: {
    marginTop: spacing.sm,
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.md,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.78,
  },

  answerWas: {
    marginTop: spacing.lg,
    color: REVIEW_COLORS.warningDark,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  correctAnswerText: {
    marginTop: spacing.xs,
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.xxl,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },

  encouragementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  encouragementBubble: {
    maxWidth: 190,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radiusTokens.xl,
    backgroundColor: REVIEW_COLORS.overlayBubble,
    borderWidth: 2,
    borderColor: REVIEW_COLORS.subtleStroke,
  },

  encouragementBubbleText: {
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontWeight: '900',
  },

  completeScreen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  fireworksLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.75,
  },

  fireworksAnimation: {
    width: '100%',
    height: '100%',
  },

  completeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },

  perfectBadgeWrapper: {
    width: 270,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },

  perfectSparkle: {
    position: 'absolute',
    color: REVIEW_COLORS.white,
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  perfectBadge: {
    minHeight: 58,
    borderRadius: radiusTokens.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: REVIEW_COLORS.greenSoft,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.success,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  perfectBadgeIcon: {
    fontSize: fontSizes.xl,
  },

  perfectBadgeText: {
    color: REVIEW_COLORS.successDark,
    fontSize: fontSizes.lg,
    lineHeight: 24,
    fontWeight: '900',
  },

  completeEmoji: {
    fontSize: REVIEW_FONT_SIZES.completeEmoji,
  },

  completeTitle: {
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.xxl,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },

  completeScoreCard: {
    width: '100%',
    borderRadius: radiusTokens.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: REVIEW_COLORS.overlayStrong,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.strongStroke,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  completeScoreLabel: {
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.xxl,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },

  completeStars: {
    marginTop: spacing.sm,
    color: REVIEW_COLORS.warning,
    fontSize: fontSizes.xxl,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  completeScoreHint: {
    marginTop: spacing.sm,
    maxWidth: 290,
    color: REVIEW_COLORS.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  completeXpCard: {
    minWidth: 220,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radiusTokens.xl,
    backgroundColor: REVIEW_COLORS.greenSoft,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.success,
    alignItems: 'center',
  },

  completeXpLabel: {
    color: REVIEW_COLORS.successDark,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    fontWeight: '900',
    opacity: 0.82,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  completeXpText: {
    marginTop: spacing.xxs,
    color: REVIEW_COLORS.successDark,
    fontSize: fontSizes.xxl,
    lineHeight: 36,
    fontWeight: '900',
  },

  completeButtonStack: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxs,
  },

  summarySecondaryButton: {
    width: '86%',
    maxWidth: 340,
    minHeight: 58,
    borderRadius: radiusTokens.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: REVIEW_COLORS.overlayBubble,
    borderWidth: 3,
    borderColor: REVIEW_COLORS.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  summarySecondaryButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },

  summarySecondaryButtonText: {
    color: REVIEW_COLORS.textDark,
    fontSize: fontSizes.lg,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
});