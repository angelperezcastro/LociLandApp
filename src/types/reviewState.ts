export type ReviewScreenState =
  | 'INTRO'
  | 'WALKING'
  | 'QUESTION'
  | 'REVEAL'
  | 'NEXT'
  | 'COMPLETE';

export const REVIEW_STATE_FLOW: ReviewScreenState[] = [
  'INTRO',
  'WALKING',
  'QUESTION',
  'REVEAL',
  'NEXT',
  'COMPLETE',
];

export const REVIEW_STATE_DESCRIPTIONS: Record<ReviewScreenState, string> = {
  INTRO:
    'Friendly welcome screen. The child understands that this is a calm memory walk, not an exam.',
  WALKING:
    'Show the station location. The child imagines walking through the palace before seeing the question.',
  QUESTION:
    'Hide the answer. Ask the child to remember what belongs to this station.',
  REVEAL:
    'Show the answer and give positive, low-pressure feedback.',
  NEXT:
    'Move to the next station or finish the session if there are no stations left.',
  COMPLETE:
    'Show review summary, XP earned, encouragement, and progress.',
};

export const getNextReviewState = (
  currentState: ReviewScreenState,
  hasMoreStations: boolean
): ReviewScreenState => {
  switch (currentState) {
    case 'INTRO':
      return 'WALKING';

    case 'WALKING':
      return 'QUESTION';

    case 'QUESTION':
      return 'REVEAL';

    case 'REVEAL':
      return hasMoreStations ? 'NEXT' : 'COMPLETE';

    case 'NEXT':
      return 'WALKING';

    case 'COMPLETE':
      return 'COMPLETE';

    default:
      return 'INTRO';
  }
};