# Week 5 — Day 1 Review State Machine

The guided review mode is the core learning experience of LociLand.

The goal is not to make the child feel examined. The goal is to make the child feel like they are calmly walking through their own memory palace.

## State Flow

INTRO → WALKING → QUESTION → REVEAL → NEXT → WALKING → ... → COMPLETE

## States

### 1. INTRO

Purpose:

- Welcome the child.
- Reduce anxiety.
- Explain that this is a calm memory walk.
- Start the ReviewSession document in Firestore.

User feeling:

- Safe.
- Curious.
- Ready.

Main UI idea:

- "Ready for a memory walk?"
- "You will visit each station one by one."

Transition:

- User taps "Start Review".
- Next state: WALKING.

---

### 2. WALKING

Purpose:

- Show the station location.
- Help the child mentally enter the palace.
- Do not ask for the answer yet.

User feeling:

- Oriented.
- Imaginative.
- Calm.

Main UI idea:

- Show palace/station name.
- Show station position.
- Optional image if available.
- Prompt: "Imagine walking to this place."

Transition:

- User taps "I'm here".
- Next state: QUESTION.

---

### 3. QUESTION

Purpose:

- Hide the answer.
- Ask the child to remember what belongs to the station.
- Give them time before revealing.

User feeling:

- Focused, but not pressured.

Main UI idea:

- "What did you place here?"
- Two buttons:
  - "I remembered"
  - "I need help"

Transition:

- User chooses whether they remembered.
- App records answer temporarily or waits until reveal interaction depending on UI implementation.
- Next state: REVEAL.

---

### 4. REVEAL

Purpose:

- Show the correct answer.
- Give warm feedback.
- Record the answer in Firestore using recordAnswer(sessionId, stationId, correct).

User feeling:

- Encouraged.
- Not punished.

Main UI idea:

- If correct:
  - "Great memory!"
- If incorrect:
  - "No problem. Look carefully and try to picture it again."

Transition:

- User taps "Next station".
- If more stations: NEXT.
- If no more stations: COMPLETE.

---

### 5. NEXT

Purpose:

- Small transition state.
- Prepare next station index.
- Avoid mixing answer feedback logic with navigation logic.

User feeling:

- Progressing.

Main UI idea:

- Very short transition.
- Could be automatic or a button.

Transition:

- Move to next station.
- Next state: WALKING.

---

### 6. COMPLETE

Purpose:

- Complete ReviewSession in Firestore using completeReview(sessionId).
- Show total correct answers.
- Show incorrect answers gently.
- Show XP earned.
- End on encouragement.

User feeling:

- Proud.
- Motivated to return.

Main UI idea:

- "Memory walk complete!"
- "You earned X XP."
- "You remembered X of Y stations."

Transition:

- User can go back to palace detail.
- Later: user can start another review.

## Important Design Rule

This screen must feel like a guided adventure, not a school exam.

Avoid:

- Red error-heavy feedback.
- Harsh failure language.
- Time pressure.
- Big "wrong answer" moments.

Prefer:

- Calm progression.
- Positive reinforcement.
- Gentle correction.
- Visual progress.
- Small rewards.