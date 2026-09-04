---
name: Memora
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#43474d'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4c6078'
  primary: '#03192e'
  on-primary: '#ffffff'
  primary-container: '#1a2e44'
  on-primary-container: '#8296b0'
  inverse-primary: '#b4c8e4'
  secondary: '#586059'
  on-secondary: '#ffffff'
  secondary-container: '#dde5db'
  on-secondary-container: '#5e665f'
  tertiary: '#181816'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c2d2a'
  on-tertiary-container: '#959490'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#b4c8e4'
  on-primary-fixed: '#061d32'
  on-primary-fixed-variant: '#35485f'
  secondary-fixed: '#dde5db'
  secondary-fixed-dim: '#c1c9bf'
  on-secondary-fixed: '#161d17'
  on-secondary-fixed-variant: '#414942'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 42px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 22px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  section-gap: 48px
---

## Brand & Style

The design system is built upon the concept of **Quiet Luxury** applied to the educational sphere. It aims to evoke the atmosphere of a private library or a high-end personal archive—calm, intentional, and intellectually stimulating. The emotional response should be one of profound focus and serenity, stripping away the "gamified" noise typical of modern learning apps.

The aesthetic follows a **Contemporary Minimalist** approach with **Tactile** nuances. It utilizes generous whitespace (negative space), paper-like textures, and a sophisticated hierarchy to guide the user's attention without friction. Every interaction is designed to feel deliberate and premium.

## Colors

The palette is rooted in organic, academic tones to foster long-term cognitive focus.

- **Primary (Deep Intellectual Blue):** `#1A2E44`. Used for primary navigation, headings, and key actions. It represents depth and stability.
- **Secondary (Sage Green):** `#8BA889`. Used for "Consolidated" states and progress indicators. It conveys organic growth and calm.
- **Surface (Paper):** `#F9F7F2`. The main background color, mimicking the texture of high-quality cream paper to reduce eye strain.
- **Accent (Soft Amber):** `#F2D492`. Used for "Consolidating" states, providing a warm, non-urgent signal of progress.
- **Neutral (Slate Gray):** `#4A4A4A` for body text and `#7A8C99` for "Archived" states, maintaining a low-contrast, sophisticated look.

## Typography

This design system uses a sophisticated typographic pairing to balance tradition and utility.

- **Headlines:** *Libre Caslon Text* provides a "bibliographic" feel, referencing classical literature and academic journals. It is used for page titles and section headers to establish a tone of authority.
- **UI & Body:** *Hanken Grotesk* is used for all functional interface elements, labels, and body text. It offers high legibility and a modern, clean contrast to the serif headings.
- **Hierarchy:** Use larger serif type for emotional moments (e.g., completing a lesson) and smaller, wider-tracked sans-serif for metadata and labels.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with expanded margins to emphasize "Quiet Luxury" through negative space. 

- **Grid:** 12-column grid for desktop, 4-column for mobile.
- **Margins:** A minimum of 24px on mobile to prevent the content from feeling cramped.
- **Vertical Rhythm:** A strict 8px baseline grid is used. Sections should be separated by 48px or 64px to allow the UI to "breathe."
- **PWA Considerations:** All interactive elements must maintain a minimum touch target of 44px, with generous padding inside cards to ensure the content feels centered and protected.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** and **Ambient Shadows** rather than stark borders.

- **Surfaces:** The primary background is the Paper tone. Content sits on slightly elevated "cards" that use the same background color or a pure white, differentiated by a very soft, diffused shadow.
- **Shadows:** Use a "Long and Soft" shadow profile: `0px 4px 20px rgba(26, 46, 68, 0.05)`. The shadow color should be a tinted version of the primary blue, not pure black, to maintain the soft aesthetic.
- **Transitions:** State changes (like hovering or focusing) should involve a subtle shift in shadow depth or a microscopic scale-up (101%), reinforcing the premium, tactile nature of the system.

## Shapes

The shape language is **Rounded**, avoiding sharp edges to maintain the "Calm and Simple" narrative. 

- **Cards & Inputs:** 0.5rem (8px) radius is the standard.
- **Large Containers:** 1rem (16px) radius for major sections or modal sheets.
- **Interactive Elements:** Buttons follow the standard 0.5rem radius, unless they are secondary utility chips which may be pill-shaped.
- **Iconography:** Use ultra-fine (1px or 1.5px stroke) linear icons with slightly rounded terminals to match the typography.

## Components

- **Cards:** White or Paper-toned background. No borders; use the ambient shadow defined in Elevation. Internal padding should be at least 24px.
- **Buttons:** 
  - *Primary:* Deep Intellectual Blue with white text. High contrast, elegant.
  - *Secondary:* Transparent with a 1px Blue border or Sage Green background for "Progress" actions.
- **Consolidation Chips:**
  - *Em Consolidação:* Amber background, 10% opacity, with solid Amber text.
  - *Consolidado:* Sage background, 10% opacity, with solid Sage text.
  - *Arquivado:* Gray-blue background, 10% opacity, with Gray-blue text.
- **Progress Bar (Annual Goal):** A hairline-thin track (2px) in a light gray-blue. The active progress is a 2px solid Sage Green line. No heavy containers or percentages; use a small "label-sm" text above the bar (e.g., "75% DA META ANUAL").
- **Input Fields:** Soft background (5% darker than paper) with a bottom-only border that thickens on focus.
- **Lists:** Clean separation using whitespace or a subtle 0.5px horizontal rule in light gray-blue.