# LociLand — VCG Visual Defense Notes

## Core thesis

LociLand turns the Method of Loci into a spatial mobile interface.

The project is not only a CRUD educational app. Its visual contribution is the translation of memory concepts into graphical structures:

- palaces become worlds;
- stations become nodes;
- order becomes a path;
- review becomes a guided walk;
- progress becomes visual growth.

## VCG improvements implemented

| VCG | Implementation | Evidence to show |
| --- | --- | --- |
| VCG-02 | `MemoryPathMap` in Palace Detail | Screenshot with station nodes connected by a route. |
| VCG-04 | Cinematic Review flow | Intro, walking state, journey rail, reveal and complete states. |
| VCG-05 | Visual Progress graphics | Memory Energy card and Memory Constellation chart. |
| VCG-06 | Motion tokens | `src/theme/motion.ts`. |
| VCG-07 | Visual system documentation | `docs/visual-design-system.md`. |
| VCG-08 | World palettes | `src/theme/worlds.ts`. |
| VCG-11 | Visual audit in validation and CI | `npm run validate` and `.github/workflows/ci.yml`. |
| VCG-12 | Visual QA checklist | `docs/visual-qa-checklist.md`. |
| VCG-15 | Presentation-ready visual explanation | This document plus screenshots. |

## Screen roles

| Screen | Visual role |
| --- | --- |
| Home | Overview of memory worlds. |
| Palace Detail | Spatial route through stations. |
| Add/Edit Station | Creative workshop for memory anchors. |
| Review | Guided memory walk. |
| Progress | Growth and practice visualization. |
| Profile | Child's memory identity/passport. |
| Achievements | Reward gallery. |

## Demo explanation

Suggested explanation for the presentation:

> The Method of Loci is spatial, so the app should not represent memory as a list. In LociLand, each palace is visualized as a world, each station becomes a node, and the review flow becomes a guided walk through that path. This turns an abstract memorization technique into a concrete graphical experience for children.

## Screenshots to capture

Capture these screens for the final report/presentation:

1. Onboarding with guide character.
2. Home with multiple palace worlds.
3. Palace Detail showing `MemoryPathMap`.
4. Add Station with image/emoji memory anchor.
5. Review intro.
6. Review walking state.
7. Review question/reveal state.
8. Perfect review complete state.
9. Progress 6–9 with Memory Stars.
10. Progress 10–14 with Memory Energy and Constellation.
11. Profile.
12. Achievements.

## Final VCG checklist

- [ ] The visual system is documented.
- [ ] Motion has central tokens.
- [ ] Color worlds are centralized.
- [ ] Memory Palace is represented spatially.
- [ ] Review feels like a journey.
- [ ] Progress has custom visualizations.
- [ ] Visual audit is part of validation.
- [ ] Accessibility/contrast/touch-target checklist exists.
- [ ] Screenshots are captured for final defense.
