import { auth } from '../../services/firebase';
import { startReview } from '../../services/reviewService';
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
  primaryButton: '#111827',
  buttonShadow: '#000000',
  overlayLight: 'rgba(255, 255, 255, 0.72)',
  overlayDark: 'rgba(255, 255, 255, 0.16)',
  overlayMedium: 'rgba(255, 255, 255, 0.55)',
  overlayStrong: 'rgba(255, 255, 255, 0.8)',
  overlayBubble: 'rgba(255, 255, 255, 0.78)',
};

const getReadableTextColor = (backgroundColor: string): string => {
  const fallbackColor = REVIEW_COLORS.textSoft;

  if (!backgroundColor.startsWith('#')) {
    return fallbackColor;
  }

  const hex = backgroundColor.replace('#', '');

  if (hex.length !== 6) {
    return fallbackColor;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

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

const ProgressBar = ({
  currentIndex,
  totalStations,
}: {
  currentIndex: number;
  totalStations: number;
}) => {
  const progress = totalStations > 0 ? (currentIndex + 1) / totalStations : 0;

  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Journey progress</Text>
        <Text style={styles.progressValue}>
          {getProgressLabel(currentIndex, totalStations)}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const IntroState = ({
  data,
  textColor,
  overlayColor,
  isStarting,
  onStart,
}: {
  data: ReviewScreenData;
  textColor: string;
  overlayColor: string;
  isStarting: boolean;
  onStart: () => void;
}) => {
  const floating = useSharedValue(0);

  useEffect(() => {
    floating.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 850 }),
        withTiming(0, { duration: 850 }),
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

      <View style={styles.guideLargeWrapper}>
        <GuideLottie size={210} variant="forward" />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.buttonPressed,
          isStarting && styles.buttonDisabled,
        ]}
        disabled={isStarting}
        onPress={onStart}
      >
        <Text style={styles.primaryButtonText}>
          {isStarting ? 'Starting...' : INTRO_COPY.startButton}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const WalkingState = ({
  station,
  currentIndex,
  totalStations,
  textColor,
  overlayColor,
  onRemember,
}: {
  station: ReviewScreenStation;
  currentIndex: number;
  totalStations: number;
  textColor: string;
  overlayColor: string;
  onRemember: () => void;
}) => {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.stateContainer}>
      <ProgressBar currentIndex={currentIndex} totalStations={totalStations} />

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

      <View style={styles.smallGuideWrapper}>
        <GuideLottie size={96} variant="encourage" />
        <View style={styles.speechBubble}>
          <Text style={styles.speechBubbleText}>Take your time.</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onRemember}
      >
        <Text style={styles.primaryButtonText}>
          {WALKING_COPY.rememberButton}
        </Text>
      </Pressable>
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

      <Pressable style={styles.secondaryButton} onPress={onBackToWalking}>
        <Text style={[styles.secondaryButtonText, { color: textColor }]}>
          Back to walking state
        </Text>
      </Pressable>
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

  const textColor = useMemo(() => {
    return getReadableTextColor(
      data?.palace.backgroundColor ?? REVIEW_COLORS.defaultPalaceBackground,
    );
  }, [data?.palace.backgroundColor]);

  const overlayColor = useMemo(() => {
    return getSoftOverlayColor(textColor);
  }, [textColor]);

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
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
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
  guideLargeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: REVIEW_COLORS.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: REVIEW_COLORS.buttonShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: REVIEW_COLORS.white,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  secondaryButton: {
    minHeight: 52,
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
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: REVIEW_COLORS.textDark,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '900',
    color: REVIEW_COLORS.textDark,
  },
  progressTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.overlayMedium,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.textDark,
  },
  walkingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  stationEmojiCard: {
    width: 164,
    height: 164,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: REVIEW_COLORS.buttonShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  stationEmoji: {
    fontSize: 86,
  },
  stationName: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  walkingPrompt: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  smallGuideWrapper: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speechBubble: {
    maxWidth: 180,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: REVIEW_COLORS.overlayBubble,
  },
  speechBubbleText: {
    fontSize: 14,
    fontWeight: '800',
    color: REVIEW_COLORS.textDark,
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