---
name: Secure Election Management System
colors:
  surface: '#0e131e'
  surface-dim: '#0e131e'
  surface-bright: '#343945'
  surface-container-lowest: '#090e19'
  surface-container-low: '#171c27'
  surface-container: '#1b202b'
  surface-container-high: '#252a35'
  surface-container-highest: '#303541'
  on-surface: '#dee2f2'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dee2f2'
  inverse-on-surface: '#2b303c'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0e131e'
  on-background: '#dee2f2'
  surface-variant: '#303541'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  2xl: 4rem
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered to project absolute integrity, state-level security, and administrative efficiency. It balances the cold precision of high-stakes government infrastructure with the fluid, user-centric accessibility of modern SaaS platforms. 

The aesthetic is **Corporate Modern with Glassmorphism accents**. It utilizes a sophisticated dark-mode palette to reduce cognitive load during high-intensity monitoring periods, while employing glass-like transparency for specific high-focus areas like authentication and critical overlays. The visual language conveys a "digital fortress"—transparent yet impenetrable, professional yet approachable.

## Colors

This design system utilizes a deep-layered dark palette to establish depth and hierarchy. The primary background is a rich navy-charcoal (#0B0F1A), providing a high-contrast foundation for the vibrant accent colors. 

- **Primary (Deep Blue):** Used for primary actions and brand presence.
- **Secondary (Purple):** Used for analytical insights and administrative secondary actions.
- **Accent (Cyan):** Used for data highlights and decorative focus elements.
- **Semantic Colors:** Green and Red are reserved strictly for status indicators (Success/Danger) to ensure immediate visual communication of system health and security alerts.

Background tiers:
1. **Base (#0B0F1A):** The main canvas.
2. **Surface (#161B26):** For cards, navigation sidebars, and header regions.

## Typography

**Inter** is the cornerstone of the typographic strategy, chosen for its exceptional legibility in data-dense environments. 

- **Hierarchy:** Headlines use tighter letter-spacing and heavier weights to feel authoritative.
- **Data Clarity:** For cryptographic keys or numerical election data, use tabular lining figures to ensure vertical alignment.
- **Micro-copy:** Labels use all-caps with increased letter-spacing to differentiate metadata from interactive content.
- **Accessibility:** Line heights are generous (1.5x for body) to ensure readability during long administrative sessions.

## Layout & Spacing

The design system employs a **12-column fluid grid** for the main dashboard, allowing for flexible arrangement of data widgets. 

- **Dashboard Layout:** A fixed-width sidebar (280px) provides persistent navigation, while the main content area utilizes dynamic padding (32px on desktop, 16px on mobile).
- **Spacing Rhythm:** An 8px linear scale (4, 8, 16, 24, 32, 48, 64) is used to maintain mathematical harmony across all components.
- **Whitespace:** Generous margins are used between data modules to prevent visual clutter and mental fatigue.
- **Reflow:** On tablet, the 12-column grid collapses to 6; on mobile, it becomes a single-column stack with condensed gutters (16px).

## Elevation & Depth

Visual hierarchy is managed through three distinct methods:

1.  **Tonal Layering:** Surfaces are stacked using color. The further "forward" an element is, the lighter its charcoal background becomes.
2.  **Glassmorphism (High Elevation):** Modals, authentication cards, and popovers use a semi-transparent background (`rgba(22, 27, 38, 0.7)`) with a 20px backdrop-blur. This keeps the user grounded in the system context while focusing on the immediate task.
3.  **Ambient Shadows:** We avoid harsh blacks. Shadows are extra-diffused with a slight navy tint (`rgba(0, 0, 0, 0.4)`) to create a soft lifting effect without breaking the dark-mode immersion.
4.  **Borders:** Use low-contrast 1px strokes (`rgba(255, 255, 255, 0.1)`) to define element boundaries without adding visual weight.

## Shapes

The shape language is sophisticated and modern. While the system base is set to `Rounded` (8px), we utilize a hierarchical rounding system:

- **Buttons & Small Inputs:** 8px (0.5rem) for a precise, professional feel.
- **Cards & Data Modules:** 24px (1.5rem) to create a friendly, "enclosed" feel for complex data.
- **Authentication Containers:** 32px (2rem) to emphasize the modern, secure "SaaS" aesthetic.
- **Pills/Status Tags:** Fully rounded (999px) to distinguish them from interactive buttons.

## Components

- **Buttons:** Primary buttons use a solid Deep Blue (#3B82F6) with white text. Secondary buttons use a ghost style with a 1px border. Focus states must always show a Cyan (#06B6D4) outer glow.
- **Cards (Dashboard):** Solid #161B26 background, 24px corner radius, and a subtle 1px border. Headers within cards should have a thin bottom divider.
- **Auth Cards:** Glassmorphic effect with 32px corner radius and a more prominent white-to-transparent gradient border (1.5px).
- **Input Fields:** Inspired by Shadcn UI. Dark navy background, subtle gray-600 border that glows Primary Blue on focus. Labels sit 8px above the field.
- **Data Visualization:** Recharts-inspired. Use thin stroke lines for axes in low-opacity gray. Fill areas with linear gradients of Blue-to-Transparent or Purple-to-Transparent.
- **Status Chips:** Small, condensed labels with a low-opacity background tint matching the semantic color (e.g., Success green at 10% opacity) and a solid dot indicator.
- **Lists:** Clean, borderless rows with a subtle hover state (`#1F2937`) and 16px of vertical padding.