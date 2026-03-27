# Memory: index.md
Updated: now

SeleçãoBet sports betting app - Brazilian market, dark mode default, mobile-first

## Design System — "Neon Cinético"
- Base: #0b0e14, Surfaces: #161a21 → #1c2028 → #282c36 (no borders, bg separation only)
- Primary: #38E67D (Neon Green) - CTAs, odds, live indicators
- Secondary: #52fa8e (Bright Green) - selected odds, positive states
- Accent: #023397 (Electric Blue) - headers, info layers
- CTA gradient: #023397 → #38E67D at 135°
- Fonts: Inter (display/odds e body/UI 400-700-800)
- Glass: backdrop-blur 16px + 75% opacity
- Rule: NEVER use 1px borders. Min touch target 44x44px. Never use #FFFFFF.
- Ghost borders only at max 15% opacity outline-variant #45484f

## Tech
- Zustand for bet slip state
- Framer Motion for animations
- React Router v6, mobile-first responsive
