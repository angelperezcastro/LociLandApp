# LociLand — Visual Design System

## 1. Visual concept

LociLand represents memory as a spatial journey.

Each palace is not only a data container, but a small visual world with its own route, stations, landmarks, atmosphere and feedback.

The visual goal is to make the Method of Loci understandable without needing a long explanation.

## 2. Core metaphor

| Product concept | Visual representation |
| --- | --- |
| Palace | World |
| Station | Memory anchor |
| Order | Path |
| Review | Guided walk |
| XP | Memory energy |
| Progress | Growth pattern |

## 3. World palettes

Each palace template has its own visual palette.

| Template | Visual role |
| --- | --- |
| My Home | Warm, familiar and safe |
| Magic Castle | Fantasy, discovery and magic |
| Enchanted Forest | Calm exploration |
| Space Station | Curiosity, focus and futuristic memory |
| Underwater World | Flow, softness and visual calm |
| Dinosaur Island | Adventure, energy and play |

The world palettes are defined in:

```txt
src/theme/worlds.ts
```

This keeps visual identity centralized and avoids hardcoded visual decisions inside screens.

## 4. Motion principles

Motion is used to explain state changes, not only as decoration.

| Motion type | Use |
| --- | --- |
| Fast | Button press and micro-feedback |
| Normal | Card entrance and station appearance |
| Cinematic | Review transitions |
| Celebration | Perfect review, achievements and level up |

The motion tokens are defined in:

```txt
src/theme/motion.ts
```

## 5. VCG contribution

The main visual contribution is the transformation of the Method of Loci into a spatial interface.

The app should not show palaces only as cards or stations only as lists. It should show:

1. Stations as visual nodes.
2. Palace journeys as paths.
3. Different palace templates as different visual worlds.
4. Review mode as a guided visual walk.
5. Progress as graphical memory growth.

## 6. Design constraints

- No hardcoded colors inside components.
- No hardcoded motion values inside components.
- Screens should reuse theme tokens.
- Emojis are allowed as supportive visual anchors, but the main structure should come from paths, nodes, cards, maps and motion.
- The app must remain readable and usable for children aged 6 to 14.
