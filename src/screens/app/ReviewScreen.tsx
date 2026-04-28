import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  BounceIn,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GuideLottie } from '../../components/review/GuideLottie';
import { auth } from '../../services/firebase';
import { startReview } from '../../services/reviewService';
import { getReviewScreenData } from '../../services/reviewScreenDataService';
import type {
  ReviewScreenData,
  ReviewScreenStation,
} from '../../services/reviewScreenDataService';
import type { ReviewScreenState } from '../../types/reviewState';

type ReviewRouteParams = {
  Review: {
    palaceId: string;
    initialPalace?: ReviewScreenData['palace'];
    initialStations?: ReviewScreenStation[];
  };
};

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

const REVIEW_COLORS = {
  lightFallback: '#F7F7FB',
  textDark: '#111827',
  textMuted: '#4B5563',
  textSoft: '#374151',
  white: '#FFFFFF',
  defaultPalaceBackground: '#DDEBFF',
  overlayLight: 'rgba(255, 255, 255, 0.76)',
  overlayDark: 'rgba(255, 255, 255, 0.16)',
  overlayMedium: 'rgba(255, 255, 255, 0.55)',
  overlayStrong: 'rgba(255, 255, 255, 0.82)',
  overlayBubble: 'rgba(255, 255, 255, 0.88)',
  progressTrack: 'rgba(255,255,255,0.55)',
};

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
    return '#24C55E';
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
          {
            backgroundColor,
          },
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
  const floating = useSharedValue(0);

  useEffect(() => {
    floating.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 900 }),
        withTiming(0, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [floating]);

  const floatingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floating.value }],
    };
  });

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <View style={styles.introTopSection}>
        <Animated.View entering={BounceIn.duration(900)} style={floatingStyle}>
          <Text style={styles.palaceEmoji}>{data.palace.emoji}</Text>
        </Animated.View>

        <Text style={[styles.introHeading, { color: textColor }]}>
          Time to visit your {data.palace.name}!
        </Text>

        <View
          style={[styles.stationCountPill, { backgroundColor: overlayColor }]}
        >
          <Text style={[styles.stationCountText, { color: textColor }]}>
            You have {data.palace.stationCount} stops on this journey
          </Text>
        </View>
      </View>

      <View style={styles.introGuideSection}>
        <GuideLottie size={210} variant="forward" />

        <View style={styles.guideSpeechBubble}>
          <Text style={styles.guideSpeechBubbleText}>Follow me!</Text>
        </View>
      </View>

      <View style={styles.introButtonSection}>
        <ReviewPrimaryButton
          label={isStarting ? 'Starting...' : INTRO_COPY.startButton}
          backgroundColor={buttonFillColor}
          textColor={buttonTextColor}
          disabled={isStarting}
          onPress={onStart}
        />
      </View>
    </Animated.View>
  );
};

const WalkingState = ({
  station,
  currentIndex,
  totalStations,
  textColor,
  overlayColor,
  buttonFillColor,
  buttonTextColor,
  onRemember,
}: {
  station: ReviewScreenStation;
  currentIndex: number;
  totalStations: number;
  textColor: string;
  overlayColor: string;
  buttonFillColor: string;
  buttonTextColor: string;
  onRemember: () => void;
}) => {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <ProgressBar
        currentIndex={currentIndex}
        totalStations={totalStations}
        textColor={textColor}
      />

      <View style={styles.walkingContent}>
        <Animated.View
          key={station.id}
          entering={SlideInRight.springify().damping(14).mass(0.8)}
          style={[styles.stationEmojiCard, { backgroundColor: overlayColor }]}
        >
          <Text style={styles.stationEmoji}>{station.emoji}</Text>
        </Animated.View>

        <Text style={[styles.stationName, { color: textColor }]}>
          {station.name}
        </Text>

        <Text style={[styles.walkingPrompt, { color: textColor }]}>
          {WALKING_COPY.prompt}
        </Text>
      </View>

      <View style={styles.walkingGuideSection}>
        <GuideLottie size={104} variant="encourage" />

        <View style={styles.guideSpeechBubble}>
          <Text style={styles.guideSpeechBubbleText}>Take your time.</Text>
        </View>
      </View>

      <View style={styles.walkingButtonSection}>
        <ReviewPrimaryButton
          label={WALKING_COPY.rememberButton}
          backgroundColor={buttonFillColor}
          textColor={buttonTextColor}
          onPress={onRemember}
        />
      </View>
    </Animated.View>
  );
};

const QuestionPlaceholderState = ({
  textColor,
  onBackToWalking,
}: {
  textColor: string;
  onBackToWalking: () => void;
}) => {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderEmoji}>✨</Text>
        <Text style={styles.placeholderTitle}>QUESTION state reached</Text>
        <Text style={styles.placeholderText}>
          This is intentionally only a placeholder. Today we are committing the
          INTRO and WALKING states. The real QUESTION and REVEAL states come in
          the next phase.
        </Text>
      </View>

      <View style={styles.walkingButtonSection}>
        <Pressable style={styles.secondaryButton} onPress={onBackToWalking}>
          <Text style={[styles.secondaryButtonText, { color: textColor }]}>
            Back to walking state
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export const ReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ReviewRouteParams, 'Review'>>();

  const { palaceId, initialPalace, initialStations } = route.params;

  const [data, setData] = useState<ReviewScreenData | null>(null);
  const [screenState, setScreenState] = useState<ReviewScreenState>('INTRO');
  const [currentStationIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const buttonTextColor = REVIEW_COLORS.white;

  const currentStation = data?.stations[currentStationIndex] ?? null;

  const handleStartJourney = async () => {
    if (!data) return;

    if (data.stations.length < 2) {
      Alert.alert('Not enough stations', INTRO_COPY.notEnoughStations);
      return;
    }

    const currentUserId = auth.currentUser?.uid;

    if (!currentUserId) {
      Alert.alert(
        'Session unavailable',
        'You need to be logged in before starting a review.',
      );
      return;
    }

    try {
      setIsStarting(true);

      const session = await startReview({
        palaceId: data.palace.id,
        userId: currentUserId,
        totalStations: data.stations.length,
      });

      setSessionId(session.id);
      setScreenState('WALKING');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The review session could not be started.';

      Alert.alert('Could not start review', message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRemember = () => {
    if (!sessionId) {
      Alert.alert(
        'Review session missing',
        'The review session was not created correctly.',
      );
      return;
    }

    setScreenState('QUESTION');
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
          overlayColor={overlayColor}
          buttonFillColor={buttonFillColor}
          buttonTextColor={buttonTextColor}
          onRemember={handleRemember}
        />
      )}

      {screenState === 'QUESTION' && (
        <QuestionPlaceholderState
          textColor={textColor}
          onBackToWalking={() => setScreenState('WALKING')}
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
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: REVIEW_COLORS.lightFallback,
  },

  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: REVIEW_COLORS.textSoft,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: REVIEW_COLORS.lightFallback,
  },

  errorEmoji: {
    fontSize: 56,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: REVIEW_COLORS.textMuted,
    textAlign: 'center',
  },

  introTopSection: {
    alignItems: 'center',
    gap: 18,
    marginTop: 6,
  },

  palaceEmoji: {
    fontSize: 104,
    textAlign: 'center',
  },

  introHeading: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    textAlign: 'center',
  },

  stationCountPill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },

  stationCountText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  introGuideSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },

  walkingGuideSection: {
    marginTop: 34,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  guideSpeechBubble: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: REVIEW_COLORS.overlayBubble,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  guideSpeechBubbleText: {
    fontSize: 15,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
    textAlign: 'center',
  },

  introButtonSection: {
    alignItems: 'center',
    marginTop: 34,
  },

  walkingButtonSection: {
    alignItems: 'center',
    marginTop: 42,
  },

  primaryButtonOuter: {
  width: '86%',
  maxWidth: 340,
  borderRadius: 32,
  borderWidth: 3,
  borderColor: REVIEW_COLORS.white,
  backgroundColor: 'rgba(255,255,255,0.28)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
  elevation: 5,
  overflow: 'hidden',
},

  primaryButton: {
    minHeight: 64,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  primaryButtonText: {
  fontSize: 20,
  fontWeight: '900',
  textAlign: 'center',
  textShadowColor: 'rgba(0,0,0,0.18)',
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
    borderRadius: 26,
    borderWidth: 2,
    borderColor: REVIEW_COLORS.textDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: REVIEW_COLORS.overlayLight,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
  },

  progressWrapper: {
    gap: 8,
    marginTop: 4,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressLabel: {
    fontSize: 16,
    fontWeight: '900',
  },

  progressValue: {
    fontSize: 16,
    fontWeight: '900',
  },

  progressTrack: {
    height: 16,
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.progressTrack,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  walkingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 54,
  },

  stationEmojiCard: {
    width: 170,
    height: 170,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },

  stationEmoji: {
    fontSize: 86,
  },

  stationName: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    textAlign: 'center',
  },

  walkingPrompt: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  placeholderCard: {
    marginTop: 80,
    padding: 24,
    borderRadius: 32,
    backgroundColor: REVIEW_COLORS.overlayStrong,
    alignItems: 'center',
    gap: 12,
  },

  placeholderEmoji: {
    fontSize: 56,
  },

  placeholderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
    textAlign: 'center',
  },

  placeholderText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: REVIEW_COLORS.textMuted,
    textAlign: 'center',
  },
});