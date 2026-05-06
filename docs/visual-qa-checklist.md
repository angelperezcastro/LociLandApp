# LociLand — Visual QA Checklist

## Purpose

This checklist prevents the final visual polish from becoming subjective. A screen is not accepted because it "looks fine"; it is accepted only when it passes the checks below on a real mobile device.

## Screens to test

- Onboarding
- Login
- Register
- Home
- Create Palace
- Palace Detail
- Add Station
- Edit Station
- Review
- Progress
- Profile
- Achievements

## 1. Layout and spacing

| Check | Pass criteria |
| --- | --- |
| Safe area | No important text, button, icon, badge or card is hidden under the status bar, notch, tab bar or home indicator. |
| Vertical fit | Primary action is visible without scrolling on the key state of the screen. |
| Card spacing | Adjacent cards have clear separation and do not visually merge. |
| Scroll behavior | Long screens scroll naturally and never trap the user below a floating button. |
| Small-phone behavior | Layout remains usable on a small Android device or equivalent narrow viewport. |

## 2. Touch targets

| Element | Minimum target |
| --- | --- |
| Primary buttons | 56 px height |
| Secondary buttons | 48 px height |
| Icon buttons | 44 × 44 px |
| Station/map nodes | 44 × 44 px |
| Review answer options for 6–9 | 56 px height |

## 3. Contrast and readability

| Check | Pass criteria |
| --- | --- |
| Main text | Dark text on pastel/light backgrounds is readable outdoors or at medium brightness. |
| Button text | Button labels remain readable in all variants. |
| Disabled state | Disabled buttons look disabled but their labels are still legible. |
| Overlay text | Toasts, modals and celebration banners do not place text over busy graphics. |
| Image nodes | User images are not clipped or hidden by borders. |

## 4. Age-group differentiation

### 6–9 years

- Larger text is visible in Review, Progress and Profile.
- Review uses simple multiple-choice interaction.
- Touch targets are visibly large.
- Progress uses stars and simple visual metaphors instead of dense metrics.
- Emoji/visual anchors support the task without cluttering the screen.

### 10–14 years

- Review allows more precise interaction.
- Numeric XP, levels and progress remain visible.
- Progress charts are slightly more analytical.
- UI feels older without becoming adult or sterile.

## 5. Motion and reduced motion discipline

| Check | Pass criteria |
| --- | --- |
| Motion purpose | Animation explains navigation, feedback, reward or state change. |
| No excessive loops | Lottie/looping animations do not distract from input fields or key CTAs. |
| Timing | Short UI animations feel fast; celebrations can be longer. |
| No layout jumps | Animated elements must not push CTAs off-screen after loading. |
| Reduced motion readiness | If reduced-motion support is added later, all decorative animation can be bypassed without breaking the screen. |

## 6. VCG-specific acceptance

| Area | Pass criteria |
| --- | --- |
| Palace Detail | Stations are represented as a visual path, not only as a list. |
| Review | The flow feels like a guided journey through stations. |
| Progress | Progress is shown through custom visualizations, not only counters. |
| Worlds | Different palace templates have visibly different palettes. |
| Documentation | The visual system can be explained with design tokens, roles and screenshots. |

## Final acceptance rule

A screen is accepted only when:

1. TypeScript passes.
2. Visual audit passes.
3. The screen was checked on a real phone.
4. The main CTA is visible without accidental scrolling.
5. No visual element is clipped by safe area, border radius or tab bar.
