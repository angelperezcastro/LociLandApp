# LociLand — User Manual

**A playful Memory Palace Builder for children aged 6–14**

| Document | Details |
| --- | --- |
| App name | **LociLand** |
| Purpose | Help children create, organise and review memory palaces using the Method of Loci |
| Target audience | Children aged **6–14**, parents/tutors and academic evaluators |
| Document version | **1.0** |
| Recommended demo format | Installed Android APK build, not Expo Go |

---

## Table of Contents

1. [What LociLand Is](#1-what-lociland-is)
2. [Before You Start](#2-before-you-start)
3. [First Use](#3-first-use)
4. [Home Screen](#4-home-screen)
5. [Creating a Memory Palace](#5-creating-a-memory-palace)
6. [Palace Detail](#6-palace-detail)
7. [Adding a Station](#7-adding-a-station)
8. [Review Mode](#8-review-mode)
9. [Gamification](#9-gamification)
10. [Profile, Progress and Achievements](#10-profile-progress-and-achievements)
11. [How to Use LociLand Well](#11-how-to-use-lociland-well)
12. [Troubleshooting](#12-troubleshooting)
13. [One-Page Quick Guide](#13-one-page-quick-guide)
14. [Screenshot Checklist](#14-screenshot-checklist)

---

## 1. What LociLand Is

**LociLand** is a mobile educational app that helps children practise memory through the **Memory Palace** technique, also known as the **Method of Loci**.

The idea is simple:

> Instead of memorising information as an isolated list, the child places each idea inside a familiar or imaginative route. Later, they mentally walk through that route to remember each item in order.

In LociLand, this technique becomes a visual mobile experience:

| Memory technique concept | LociLand representation |
| --- | --- |
| A place or mental environment | A **Memory Palace** |
| A point in the route | A **Station** |
| The order of recall | The **memory route** |
| Practising recall | **Review Mode** |
| Motivation and habit-building | **XP, levels, streaks and achievements** |

The app is designed to be friendly and playful without becoming childish. It uses large cards, emojis, colourful palace templates, visual paths, animations and rewards to make memory practice understandable for children and demonstrable for evaluators.


---

## 2. Before You Start

Before using LociLand, make sure the following conditions are met.

| Requirement | Why it matters |
| --- | --- |
| The app is installed on a mobile device | LociLand is designed for mobile interaction and should be tested on a real phone where possible. |
| The user has an account | Palaces, stations, reviews and progress are linked to a personal user profile. |
| Internet connection is available | Firebase Authentication, Firestore and Storage require network access for account login, cloud data and images. |
| Firebase configuration is correctly deployed | The app depends on Firebase services for authentication, database and station image storage. |
| For the final demo, use the APK build | Expo Go may not behave exactly like an installed build, especially for native features such as notifications or production configuration. |

### Recommended demo setup

For the university presentation or final evaluation, use an installed APK build rather than Expo Go. This gives a more realistic product experience and avoids Expo Go limitations.

Recommended flow before the demo:

1. Install the APK on an Android device.
2. Log in with a prepared demo account.
3. Confirm that at least one palace contains several stations.
4. Confirm that review mode works.
5. Keep a backup screen recording of the main flow.

---

## 3. First Use

The first use flow introduces the app, creates the child profile and prepares the adaptive experience.

### 3.1 Open the app

When the app opens, LociLand loads its initial state. If the user has not completed onboarding before, the onboarding screens are shown first. If onboarding was already completed, the app opens the login flow.

### 3.2 Complete onboarding

The onboarding explains the basic idea of a Memory Palace and introduces the user to the visual style of the app.

A typical onboarding flow includes:

1. A simple introduction to the Memory Palace idea.
2. A playful explanation of choosing a place.
3. A final step that invites the user to start.

The user can continue through the onboarding or skip it and go to the login screen.


### 3.3 Create an account

To create an account, the user provides:

| Field | Description |
| --- | --- |
| Username | Display name used inside the app. |
| Email | Used for login and password recovery. |
| Password | Must be at least 6 characters. |
| Age group | Either **6–9 years** or **10–14 years**. |
| Avatar | An animal-style emoji avatar used in the profile and Home screen. |

The app requires the age group and avatar selection. This is important because the interface adapts parts of the experience depending on the child’s age group.



### 3.4 Choose an age group

LociLand uses the age group to adjust the review and progress experience.

| Age group | Experience |
| --- | --- |
| **6–9 years** | Larger visuals, simpler interactions, multiple-choice review and star-based progress. |
| **10–14 years** | More detailed statistics, free-text review, timer and numeric XP/level information. |

The age group can also be changed later from the Profile screen.

### 3.5 Log in

Returning users can log in with email and password. If the user forgets the password, the app can send a password reset email.

The app also includes a Google sign-in option when the required Google OAuth configuration is available.

---

## 4. Home Screen

The **Home** screen is the main dashboard of LociLand.

It shows:

- a greeting with the user’s display name;
- the selected avatar;
- the user’s memory palaces;
- a button to create a new palace;
- loading, empty and error states when needed.



### 4.1 When there are no palaces

If the account has no palaces yet, the Home screen displays an empty state encouraging the user to create the first palace.

The empty state is not just decorative. It explains the first action clearly: start by building a palace.

Recommended first action:

> Tap **Start building** or the **+** button.

### 4.2 When palaces already exist

Each palace appears as a visual card. A palace card usually shows:

| Element | Meaning |
| --- | --- |
| Palace emoji | The selected palace template. |
| Palace name | The name chosen by the user. |
| Station count | Number of stations inside that palace. |
| Review shortcut | Opens review mode for that palace when possible. |

### 4.3 Opening a palace

Tap a palace card to open its detail screen. This takes the user into the palace route, where stations can be added, edited, deleted or reordered.

### 4.4 Creating a new palace

Tap the **+** button on Home to open the palace creation screen.

### 4.5 Deleting a palace

A palace can be deleted from the Home screen through the delete interaction. Because deletion removes the palace and its associated content, the app asks for confirmation before completing the action.

Use deletion carefully during demos. It is better to prepare a separate test palace if deletion needs to be shown.

---

## 5. Creating a Memory Palace

The **Create Palace** screen guides the user through three steps:

1. type a palace name;
2. choose a visual template;
3. preview and create the palace.



### 5.1 Palace name

The palace name should be short and meaningful.

Good examples:

- `History Castle`
- `Science House`
- `English Forest`
- `My Space Palace`

Avoid vague names such as:

- `Things`
- `Test`
- `Random`
- `Exam stuff`

A good palace name helps the child understand what type of knowledge belongs inside it.

### 5.2 Palace templates

LociLand provides six palace templates.

| Template | Emoji | Best use |
| --- | --- | --- |
| **My Home** | 🏠 | Familiar routes, daily objects, simple lists and first practice. |
| **Magic Castle** | 🏰 | Stories, history, fantasy-themed learning and memorable sequences. |
| **Enchanted Forest** | 🌲 | Nature, animals, calm exploration and concept groups. |
| **Space Station** | 🚀 | Science, planets, technology and structured facts. |
| **Underwater World** | 🐠 | Ocean topics, biology, soft visual memory cues. |
| **Dinosaur Island** | 🦕 | Adventure topics, timelines, categories and energetic learning. |

The template is more than decoration. It gives the palace a visual identity, making it easier to remember as a distinct mental space.

### 5.3 Preview

Before creating the palace, the app shows a preview card. This helps the user understand how the palace will appear on the Home screen.

### 5.4 Good palace design

A good Memory Palace should have a clear route.

For beginners:

- start with 3–5 stations;
- use familiar or visually strong places;
- keep one idea per station;
- avoid creating 20 stations immediately;
- use the same palace for related information.

For example, a **History Castle** could contain:

1. Gate — “Romans arrive in Hispania”
2. Main Hall — “Al-Andalus begins”
3. Tower — “1492: Granada and America”
4. Library — “Constitution of 1812”

---

## 6. Palace Detail

The **Palace Detail** screen is where the child builds and manages the memory route.



The screen shows:

- the palace name;
- the palace template emoji;
- the template description;
- the number of stations;
- a visual memory route when stations exist;
- station controls;
- the **Start Review** button;
- the **+** button for adding stations.

### 6.1 What the memory route means

The memory route is the path the child follows mentally.

Each station is a stop in that route. When reviewing, the app presents stations in order. This order matters because the Method of Loci works best when the brain follows a stable sequence.

### 6.2 What stations are

A **station** is a memory anchor.

It contains:

| Field | Purpose |
| --- | --- |
| Emoji | Quick visual cue. |
| Station name | Short location label. |
| Memory text | The information to remember. |
| Optional image | Extra visual support. |
| Order | Position in the memory route. |

### 6.3 Adding stations

Tap the **+** button to add a new station.

### 6.4 Editing stations

Tap the edit action on a station to reopen the station form with the current information already filled in.

Use editing to:

- improve unclear names;
- correct memory text;
- replace or remove images;
- make a station more memorable.

### 6.5 Deleting stations

A station can be deleted from the palace detail flow. The app asks for confirmation because deleting a station removes it from the route and updates the palace count.

### 6.6 Reordering stations

Stations can be reordered by holding and dragging a station card.

This is a key pedagogical feature. The order should follow a route that makes sense in the child’s imagination.

Good ordering example:

1. Front door
2. Hallway
3. Kitchen
4. Bedroom
5. Garden

Poor ordering example:

1. Garden
2. Kitchen
3. Front door
4. Bedroom
5. Hallway

The first version is easier because it feels like a real walk.

### 6.7 Starting a review

A palace needs at least **2 stations** to start a review.

If there are fewer than 2 stations, the Start Review button is disabled or asks the user to add more stations first. Review mode supports routes up to 20 stations.

---

## 7. Adding a Station

The **Add Station** screen is used to create a new memory stop inside a palace.


The form has four main parts:

1. choose an emoji;
2. name the station;
3. write the memory text;
4. optionally add a photo.

### 7.1 Choose an emoji

The emoji acts as a fast visual anchor.

LociLand groups emojis into categories such as:

- animals;
- objects;
- places;
- food;
- symbols.

Choose an emoji that makes the station easier to remember. The emoji does not need to be literal; it just needs to be memorable.

Examples:

| Topic | Possible emoji |
| --- | --- |
| A king | 👑 |
| Fire or energy | 🔥 |
| A book fact | 📚 |
| A planet | 🚀 |
| A hidden clue | 🔑 |

### 7.2 Name the station

The station name should be short and concrete.

Good station names:

- `Front door`
- `Kitchen table`
- `Castle gate`
- `Rocket window`
- `Forest bridge`

Avoid long or abstract station names.

### 7.3 Write the memory text

The memory text is the information the child wants to recall.

Good memory text:

> “Mercury is the closest planet to the Sun.”

Weak memory text:

> “Planets and stuff.”

A station should usually contain one main idea. If the text is too long, split it into several stations.

### 7.4 Add an image

Images are optional. They are useful when:

- the station is based on a real place;
- the child wants a stronger visual cue;
- the memory is easier to recall with a picture;
- the palace is being used for a school subject with diagrams or objects.

The app allows the user to choose an image from the gallery. Supported images are JPG, PNG and WebP, with a maximum size of 2 MB.

### 7.5 Save the station

The app requires at least:

- one emoji;
- one station name.

The memory text and image are optional, but strongly recommended for useful practice.

### 7.6 Good station examples

| Station | Memory text | Why it works |
| --- | --- | --- |
| 🏰 Castle gate | “1492: Granada is conquered.” | Concrete image + short historical fact. |
| 🚀 Rocket window | “Mercury is closest to the Sun.” | Strong visual link to space. |
| 📚 Library desk | “A noun names a person, place or thing.” | Clear school concept. |
| 🔥 Volcano | “Magma becomes lava after eruption.” | Visual, dramatic and memorable. |

---

## 8. Review Mode

**Review Mode** is the core learning loop of LociLand.

It guides the user through the palace route and asks them to remember what they placed at each station.


### 8.1 When review can start

Review mode can start when:

- the user is logged in;
- the palace exists;
- the palace has at least **2 stations**;
- the station data has loaded correctly;
- the palace does not exceed the review station limit.

If the palace has only one station, add another station first.

### 8.2 Review states

The review flow is organised as a guided sequence.

| State | What happens |
| --- | --- |
| **Intro** | The app prepares the user for the journey and shows the palace context. |
| **Walking** | The app shows the current station as part of the route. |
| **Question** | The user answers what they placed at that station. |
| **Reveal** | The app shows whether the answer was correct and reveals the expected answer. |
| **Complete** | The app summarises the review and applies progress rewards. |

### 8.3 Intro state

The Intro state tells the child that they are about to visit the selected palace.

It usually shows:

- the palace name;
- the palace visual identity;
- the number of stops;
- a button to start the journey.

Recommended behaviour:

> Pause briefly and remind the child to imagine entering the palace before tapping the start button.

### 8.4 Walking state

The Walking state presents one station at a time.

It shows:

- the station emoji;
- the station name;
- the position in the journey;
- visual route feedback;
- a prompt asking what was placed there.

The goal is not to guess randomly. The child should imagine the route and try to recall the station content.

### 8.5 Question state

The question format depends on the age group.

| Age group | Question format |
| --- | --- |
| **6–9 years** | Multiple-choice answers. |
| **10–14 years** | Free-text input, with more detailed challenge. |

For younger users, multiple choice reduces cognitive load and keeps the experience accessible.

For older users, free-text recall creates a stronger memory practice because the child must actively produce the answer.

### 8.6 Reveal state

After answering, the app shows feedback.

If the answer is correct, the app provides a positive celebration.

If the answer is incorrect, the app reveals the correct answer in an encouraging way. The purpose is to support learning, not to punish mistakes.

Good interpretation:

- Correct answer: the memory link is working.
- Incorrect answer: the station may need a clearer image, name or memory text.
- Repeated mistakes: simplify the station or split the information.

### 8.7 Complete state

At the end of the route, the app shows a completion summary.

This may include:

- number of correct answers;
- XP earned;
- progress feedback;
- celebration effects;
- a special perfect review message when all answers are correct;
- options to review again or return to the palace.

### 8.8 Leaving review mode

Review mode is a focused session. If the user tries to go back during a review, the app may ask for confirmation to avoid accidentally losing the session flow.

---

## 9. Gamification

LociLand uses gamification to support motivation and habit formation.

The rewards are not the learning objective. They are used to encourage regular practice and make progress visible.

### 9.1 XP

XP represents memory practice progress.

Users can earn XP from actions such as:

- creating a palace;
- adding stations;
- completing review sessions;
- completing a perfect review;
- unlocking achievements.

### 9.2 Levels

Levels translate XP into a simple sense of growth.

A user starts at a low memory level and progresses by practising. Higher levels represent accumulated use of the app and successful memory work.

Examples of level identity include titles such as:

- Memory Seedling;
- Palace Explorer;
- Memory Knight;
- Palace Wizard;
- Memory Master.

### 9.3 Streak

A streak represents consecutive days of activity.

The streak encourages the child to return to their palaces regularly. This matters because memory improves through repeated retrieval, not one-time exposure.

### 9.4 Achievements

Achievements are milestone badges.

Examples include:

| Achievement | Meaning |
| --- | --- |
| **First Steps** | Create the first memory palace. |
| **Builder** | Add several stations. |
| **Architect** | Create multiple palaces. |
| **Dedicated Learner** | Complete multiple reviews. |
| **Perfect Mind** | Complete a perfect review. |
| **On Fire** | Reach a 7-day streak. |
| **Explorer** | Use all palace templates. |
| **Photographer** | Add images to several stations. |
| **Memory Knight** | Reach Level 5. |
| **Memory Master** | Reach Level 10. |
| **Speed Demon** | Complete a fast review as an older user. |

### 9.5 Why rewards are used

Rewards help children see effort as progress.

In LociLand, gamification supports three learning goals:

1. **Consistency** — return often.
2. **Confidence** — mistakes are part of the process.
3. **Completion** — finish review sessions instead of only creating content.

---

## 10. Profile, Progress and Achievements

LociLand includes three main progress-related areas: **Profile**, **Progress** and **Achievements**.

---

### 10.1 Profile

The Profile screen shows the child’s identity inside LociLand.

The Profile screen may show:

- avatar;
- display name;
- email;
- current level or memory title;
- streak;
- XP or star-based memory power;
- palace, station and review statistics;
- access to achievements;
- settings.

From Profile, the user can also:

- change avatar;
- change age group;
- send a password reset email;
- log out;
- delete the sign-in account.

### Age group behaviour in Profile

| Age group | Profile behaviour |
| --- | --- |
| **6–9 years** | Uses friendlier visual labels, stars and larger text. |
| **10–14 years** | Shows more explicit XP, level and stat information. |

---

### 10.2 Progress

The Progress screen shows how the user is developing over time.


For older users, Progress can include:

- total XP;
- current level;
- XP remaining for the next level;
- weekly activity;
- total palaces;
- total stations;
- completed reviews;
- best streak;
- recent achievements.

For younger users, Progress is simplified:

- memory stars;
- visual activity;
- adventure-style stats;
- recent badges without overwhelming numbers.

### How to interpret progress

| Signal | Meaning |
| --- | --- |
| More stations | The child is building richer memory routes. |
| More reviews | The child is practising retrieval. |
| Higher streak | The habit is becoming consistent. |
| More achievements | The child has reached learning milestones. |
| Perfect reviews | The palace route is clear and memorable. |

---

### 10.3 Achievements

The Achievements screen displays earned and locked badges.

The screen shows:

- total unlocked achievements;
- progress percentage;
- earned badge cards;
- locked badge cards;
- mystery rewards for achievements not yet earned.

Locked achievements are intentionally partially hidden. This creates curiosity while keeping the interface clean.

---

## 11. How to Use LociLand Well

LociLand works best when the memory route is designed carefully.

### 11.1 Start small

Begin with 3–5 stations.

A small palace is easier to review and less intimidating. Once the child understands the method, larger palaces can be created.

### 11.2 Use clear station names

Station names should be places or objects, not abstract ideas.

Good:

- `Front door`
- `Dragon statue`
- `Kitchen table`

Weak:

- `Thing 1`
- `Important`
- `School topic`

### 11.3 Use one idea per station

Do not overload a single station.

Weak station:

> “Romans, Greeks, Middle Ages, Columbus, Constitution and Industrial Revolution.”

Better version:

1. Station 1 — Romans
2. Station 2 — Greeks
3. Station 3 — Middle Ages
4. Station 4 — Columbus
5. Station 5 — Constitution

### 11.4 Make images memorable

An image should strengthen the memory cue.

Useful images:

- a real photo of a room;
- a diagram from class;
- a drawing of the concept;
- a visually unusual object.

Avoid generic images that do not help recall.

### 11.5 Keep the route logical

The order should feel like a walk.

A logical route reduces effort because the child can mentally move from one station to the next.

### 11.6 Review frequently

Memory improves through retrieval.

Recommended rhythm:

- review a new palace soon after creating it;
- review again later the same day;
- review the next day;
- return during the week.

### 11.7 Do not memorise long lists without structure

The Method of Loci is powerful because it adds structure.

If the child has a long list, divide it into:

- categories;
- smaller palaces;
- short routes;
- related station groups.

---

## 12. Troubleshooting

This section covers common user problems.

---

### 12.1 I cannot log in

Possible causes:

| Cause | What to do |
| --- | --- |
| Incorrect email or password | Check the email spelling and password. |
| Forgotten password | Use **Forgot password?** on the login screen. |
| No internet connection | Reconnect to Wi-Fi or mobile data. |
| Firebase/Auth configuration issue | For demos, confirm the build uses the correct Firebase project variables. |

---

### 12.2 My palaces do not appear

Possible causes:

| Cause | What to do |
| --- | --- |
| Data is still loading | Pull down to refresh the Home screen. |
| Network issue | Check the internet connection. |
| Wrong account | Log out and log in with the correct email. |
| Firebase sync delay | Wait briefly and refresh again. |

---

### 12.3 I cannot start a review

The most common reason is that the palace does not have enough stations.

Review mode requires at least **2 stations**.

Other possible causes:

- stations are still loading;
- the palace was deleted or cannot be found;
- the palace route has more stations than review mode supports;
- there is a temporary Firebase read problem.

What to do:

1. Open the Palace Detail screen.
2. Confirm there are at least 2 stations.
3. Pull to refresh or reopen the palace.
4. Try again.

---

### 12.4 An image does not load

Possible causes:

| Cause | What to do |
| --- | --- |
| No internet connection | Reconnect and reopen the station. |
| Unsupported file type | Use JPG, PNG or WebP. |
| Image too large | Use an image under 2 MB. |
| Storage permission problem | In a demo build, confirm Firebase Storage rules are deployed. |
| Image was removed | Edit the station and select a new photo. |

---

### 12.5 The app seems not to save changes

What to check:

1. Confirm the device has internet access.
2. Wait a few seconds after saving.
3. Pull to refresh the screen.
4. Log out and log back in.
5. Reopen the palace or profile.

If the issue happens during a demo, use a prepared backup account with known valid data.

---

### 12.6 A button does not respond

Possible causes:

- the app is already saving or deleting something;
- the required fields are incomplete;
- the user session is still loading;
- the screen is waiting for Firebase.

What to do:

- check that required fields are filled;
- wait for loading indicators to finish;
- reopen the screen if needed.

---

### 12.7 I selected the wrong age group

The age group can be changed from the Profile screen.

Steps:

1. Open **Profile**.
2. Tap **Change age group**.
3. Select **6–9 years** or **10–14 years**.
4. Return to Review or Progress to see the adapted experience.

---

### 12.8 Something fails during the final demo

Recommended fallback plan:

1. Keep the installed APK ready.
2. Keep a prepared user account.
3. Keep a palace with at least 3 stations.
4. Keep screenshots in `docs/final-delivery/screenshots/`.
5. Keep a one-minute screen recording of the core flow.

If live Firebase sync fails, use the recording and screenshots to demonstrate the intended user flow.

---

## 13. One-Page Quick Guide


### Step-by-step cheat sheet

| Step | Action | Result |
| --- | --- | --- |
| 1 | Open LociLand | Start from onboarding, login or Home. |
| 2 | Create account | Choose username, age group and avatar. |
| 3 | Create palace | Choose a name and template. |
| 4 | Add stations | Add emoji, station name, memory text and optional image. |
| 5 | Order the route | Drag stations into a logical sequence. |
| 6 | Start review | Walk through the palace and answer questions. |
| 7 | Read feedback | Correct answers are celebrated; mistakes reveal the answer kindly. |
| 8 | Complete review | Earn XP, update progress and unlock achievements. |
| 9 | Check Profile/Progress | See level, streak, stars, stats and badges. |
| 10 | Repeat often | Review regularly to strengthen memory. |

### Best beginner setup

| Item | Recommendation |
| --- | --- |
| First palace | **My Home** or **Magic Castle** |
| First route length | 3–5 stations |
| First station names | Real or easily imagined places |
| First memory text | One short idea per station |
| First review | Immediately after creating the route |

---

## 14. Screenshot Checklist

Use this section when preparing the final academic delivery.

Insert real screenshots at the following paths:

| Screenshot | Required path | Purpose |
| --- | --- | --- |
| Onboarding | `docs/final-delivery/screenshots/01-onboarding.png` | Shows the first-use experience. |
| Home with palaces | `docs/final-delivery/screenshots/02-home-with-palaces.png` | Shows the main dashboard with created palaces. |
| Palace Detail | `docs/final-delivery/screenshots/03-palace-detail.png` | Shows the memory route and station management. |
| Add Station | `docs/final-delivery/screenshots/04-add-station.png` | Shows how a memory station is created. |
| Review Question | `docs/final-delivery/screenshots/05-review-question.png` | Shows the active recall interaction. |
| Review Reveal | `docs/final-delivery/screenshots/06-review-reveal.png` | Shows feedback after an answer. |
| Profile | `docs/final-delivery/screenshots/07-profile.png` | Shows identity, settings and progress summary. |
| Achievements | `docs/final-delivery/screenshots/08-achievements.png` | Shows the badge system. |
| Progress | `docs/final-delivery/screenshots/09-progress.png` | Shows XP, stars, weekly activity or detailed stats. |


---

## Final Note

LociLand is designed around a clear learning loop:

1. build a place;
2. place information inside it;
3. walk the route;
4. retrieve from memory;
5. receive supportive feedback;
6. repeat over time.

The app is not just a flashcard replacement. Its purpose is to make spatial memory visible, manageable and motivating for children, while remaining structured enough to be defended as a serious academic mobile project.
