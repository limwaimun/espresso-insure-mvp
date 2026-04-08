# Espresso Design System

## Overview
A comprehensive design system for Espresso (espresso.insure) - an AI-powered business platform for insurance agents and IFAs across Southeast Asia.

## Brand Identity

### Mission
Give every solo agent the back-office of a top-tier brokerage.

### Brand Personality
- **Professional:** Trustworthy, reliable, expert
- **Warm:** Approachable, supportive, human-centric  
- **Modern:** Tech-forward, efficient, innovative
- **Premium:** High-quality, sophisticated, valuable

## Color Palette

### Primary Colors
- **Espresso:** `#1C0F0A` - Primary brand color, deep brown
- **Dark:** `#120A06` - Backgrounds, dark surfaces
- **Cream:** `#F5ECD7` - Primary text, light surfaces
- **Cream Dim:** `#C9B99A` - Secondary text, disabled states
- **Amber:** `#C8813A` - Primary accent, CTAs, interactive elements
- **Amber Light:** `#E8A55A` - Hover states, highlights
- **Warm Mid:** `#3D2215` - Secondary backgrounds
- **Warm Border:** `#2E1A0E` - Borders, dividers

### Status Colors
- **OK/Success:** `#5AB87A` - Positive actions, success states
- **Danger/Error:** `#D06060` - Errors, destructive actions
- **Warning:** `#D4A030` - Warnings, caution states
- **Info:** `#5A8AD4` - Informational messages
- **Teal:** `#20A0A0` - Secondary accent, special states

## Typography

### Font Families
- **Display:** `Cormorant Garamond` - Headings, brand elements
- **Body:** `DM Sans` - Body text, interface copy
- **Mono:** `DM Mono` - Code, technical content

### Scale
```
h1: 3rem (48px) - Page titles
h2: 2.25rem (36px) - Section headers
h3: 1.875rem (30px) - Subsection headers
h4: 1.5rem (24px) - Card titles
h5: 1.25rem (20px) - Small headers
h6: 1rem (16px) - Tiny headers
Body: 1rem (16px) - Default text
Small: 0.875rem (14px) - Captions, labels
```

## Spacing Scale
Based on 4px grid system:
```
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
```

## Border Radius
```
sm: 4px
md: 8px
lg: 12px
xl: 16px
2xl: 24px
full: 9999px
```

## Shadows
```
sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
```

## Components

### Buttons
- **Primary:** Amber background, dark text, rounded-lg
- **Secondary:** Warm-mid background, cream text, border
- **Ghost:** Transparent, border on hover
- **Danger:** Danger color scheme for destructive actions

### Cards
- Background: Dark with Warm Border
- Border radius: xl (16px)
- Padding: 6 (24px)
- Elevation: Subtle shadow for depth

### Forms
- Inputs: Dark background, Warm Border, rounded-lg
- Labels: Cream text, small font
- Validation: Status color borders for states
- Placeholder: Cream Dim color

### Alerts
Four variants: Success, Error, Warning, Info
- Background: Status color with 10% opacity
- Border: Status color
- Text: Status color
- Padding: 4 (16px)
- Border radius: lg (12px)

### Navigation
- Background: Dark
- Border: Warm Border bottom
- Active state: Amber underline
- Hover: Amber Light text

## Layout Principles

### Grid System
- **Container:** Max width 1280px, centered
- **Gutters:** 24px on desktop, 16px on mobile
- **Columns:** 12-column grid
- **Breakpoints:**
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### White Space
- **Section padding:** 24px vertical, 16px horizontal
- **Content spacing:** 16px between related elements
- **Group spacing:** 24px between unrelated sections
- **Isolation spacing:** 48px between major sections

## Motion

### Transitions
- **Default:** 200ms ease-in-out
- **Fast:** 150ms ease-in-out
- **Slow:** 300ms ease-in-out

### Animations
- **Fade in:** Opacity 0 to 1
- **Slide up:** Translate Y 8px to 0
- **Scale in:** Scale 0.95 to 1

## Accessibility

### Color Contrast
- All text meets WCAG AA minimum (4.5:1)
- Large text meets WCAG AA (3:1)
- Interactive elements have clear focus states

### Focus Management
- Visible focus rings on all interactive elements
- Logical tab order
- Skip links for keyboard navigation

### Screen Reader Support
- Semantic HTML structure
- ARIA labels where needed
- Proper heading hierarchy

## Implementation

### Tailwind Configuration
All design tokens are defined in `tailwind.config.ts` and available as:
- Colors: `bg-espresso`, `text-cream`, etc.
- Fonts: `font-display`, `font-body`, `font-mono`
- Components: Predefined in `globals.css`

### Component Library
Located in `/components` directory with:
- Atomic design structure
- Storybook documentation
- TypeScript support
- Responsive variants

## Usage Guidelines

### Do's
- Use the defined color palette consistently
- Follow the typography scale
- Maintain consistent spacing
- Use component variants appropriately
- Test across breakpoints

### Don'ts
- Don't invent new colors
- Don't use arbitrary font sizes
- Don't skip accessibility testing
- Don't break the grid system
- Don't override component styles without reason

## Maintenance

### Versioning
Design system follows semantic versioning:
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Contribution
1. Create a design token proposal
2. Implement in isolation
3. Test across breakpoints
4. Document changes
5. Submit for review

### Updates
- Regular audits for consistency
- Performance optimization
- Accessibility improvements
- Browser compatibility checks

---
*Last updated: 2026-04-08 by CEO Elon*