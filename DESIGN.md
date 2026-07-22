---
name: Nocturne Reserve
colors:
  surface: '#121412'
  surface-dim: '#121412'
  surface-bright: '#383a37'
  surface-container-lowest: '#0d0f0d'
  surface-container-low: '#1a1c1a'
  surface-container: '#1e201e'
  surface-container-high: '#282a28'
  surface-container-highest: '#333533'
  on-surface: '#e2e3df'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#e2e3df'
  inverse-on-surface: '#2f312e'
  outline: '#9a8f80'
  outline-variant: '#4e4639'
  surface-tint: '#e9c176'
  primary: '#e9c176'
  on-primary: '#412d00'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#775a19'
  secondary: '#dec1af'
  on-secondary: '#3f2c20'
  secondary-container: '#574335'
  on-secondary-container: '#ccb09f'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#a7a5a5'
  on-tertiary-container: '#3b3b3b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#fbddca'
  secondary-fixed-dim: '#dec1af'
  on-secondary-fixed: '#28180d'
  on-secondary-fixed-variant: '#574335'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#121412'
  on-background: '#e2e3df'
  surface-variant: '#333533'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The brand personality is that of an elite concierge: composed, knowledgeable, and impeccably dressed. It targets a discerning clientele seeking exclusive dining experiences, evoking a sense of anticipation and prestige. 

The design style is **Sophisticated Minimalism** with **Tactile** influences. It draws inspiration from the physical artifacts of high-end hospitality—the textured paper of a seasonal menu, the gold leaf on a leather-bound reservation book, and the soft, directional lighting of a dimly lit bistro. The UI avoids digital-first tropes in favor of a "printed" aesthetic, prioritizing high-fidelity food and interior photography as the primary window into the experience.

## Colors

The palette is anchored in deep, nocturnal tones to mimic the atmosphere of an upscale evening establishment.

- **Primary (Brass/Gold):** Used exclusively for high-priority actions, luxury indicators, and active states. It should feel like a metallic foil stamp.
- **Secondary (Walnut):** Used for subtle depth, container backgrounds, and section differentiation. It provides warmth to the otherwise cold charcoal base.
- **Neutral (Charcoal & Ivory):** Dark Charcoal serves as the primary "canvas," while Ivory provides high-contrast legibility for body text, ensuring a soft glow rather than a harsh white glare.
- **Surface Tiers:** Use #262626 for secondary surfaces (cards) to maintain a subtle lift from the #1A1A1A background.

## Typography

The typography system relies on the tension between the classic, high-contrast Serif and the utilitarian Sans-serif. 

**Manrope** is used for all editorial moments: restaurant names, section headers, and quotes. It should be treated with generous leading. **Inter** handles all functional UI, data points, and long-form descriptions to ensure the platform feels modern and efficient despite its traditional aesthetic. 

Uppercase styling is reserved for labels and small navigational elements to evoke the feel of a formal menu index.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain an editorial, "book-like" feel, centering the content with wide margins. 

- **Vertical Rhythm:** Built on an 8px base unit. Use generous padding (64px+) between major sections to emphasize exclusivity and "breathing room."
- **Grid:** A 12-column grid for desktop with 24px gutters. Elements like featured restaurant cards should often span 6 or 12 columns to allow photography to shine.
- **Mobile:** Transition to a single-column layout with 20px side margins. Typography scales down slightly, but the generous white (or charcoal) space remains a priority.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Subtle Textures** rather than aggressive shadows.

- **Layering:** The base layer is Charcoal (#1A1A1A). Interactive cards use the Walnut (#3D2B1F) or a slightly lighter Charcoal (#262626) to "lift" from the background.
- **Shadows:** Use extremely soft, low-opacity shadows (Color: Black, Alpha: 40%, Blur: 20px) to give cards a heavy, physical presence, like a book resting on a table.
- **Accents:** Use 1px solid borders in Brass (#C5A059) at 30% opacity for "ghost" containers or thin separators, mimicking gold-leaf edges.
- **Glassmorphism:** Reserved only for sticky navigation bars, using a backdrop blur (20px) over the background to maintain context while scrolling.

## Shapes

The shape language is primarily **Soft (0.25rem)**. This slight rounding removes the harshness of digital boxes while maintaining a structured, formal architectural feel. 

Buttons and input fields should utilize this subtle radius. Larger containers like image carousels or restaurant cards may use `rounded-lg` (0.5rem) to feel more like a physical object. Circular shapes are avoided, except for small status indicators or profile avatars.

## Components

- **Buttons:** Primary buttons are solid Brass (#C5A059) with dark text. Secondary buttons are outlined in Brass with Ivory text. All buttons use uppercase Inter for a formal tone.
- **Cards:** Restaurant cards feature a large image ratio (3:2), Ivory titles in Manrope, and a subtle "Walnut" hover state. 
- **Forms:** Input fields are minimal—1px bottom borders only (Ivory at 50% opacity) that turn Brass upon focus, mimicking a handwritten ledger line.
- **Filter Bar:** A horizontal scroll of text-only labels. The active state is indicated by a small Brass dot underneath the label rather than a bulky background pill.
- **Chips:** Used for cuisine types; styled with a dark walnut background and small brass borders.
- **Custom Component - "The Ledger":** A dedicated reservation summary component that appears on the right of the screen during booking, styled with a light paper texture and Serif typography to resemble a maître d's guest list.