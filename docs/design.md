# Map Poster Design System

## Overview

Map Poster uses a warm, artistic design language that feels like an **art studio**, not a tech tool. The aesthetic emphasizes personalization, memories, and craftsmanship.

## Color Palette

### Primary Colors (Warm Earth Tones)

| Color | Tailwind Class | Hex | Usage |
|-------|----------------|-----|-------|
| **Amber 600** | `amber-600` | `#d97706` | Primary buttons, accents, selected states |
| **Orange 600** | `orange-600` | `#ea580c` | Gradients, progress bars |
| **Stone 900** | `stone-900` | `#1c1917` | Headlines, primary text |
| **Stone 600** | `stone-600` | `#57534e` | Body text, descriptions |
| **Stone 400** | `stone-400` | `#a8a29e` | Muted text, placeholders |

### Background Gradients

**Light Mode:**
```css
bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50
```

**Dark Mode:**
```css
dark:from-stone-950 dark:via-neutral-950 dark:to-stone-900
```

### Accent Colors (Use Cases Section)

| Use Case | Color | Tailwind |
|----------|-------|----------|
| Gift | Rose | `rose-100`, `rose-700` |
| Home Decor | Emerald | `emerald-100`, `emerald-700` |
| Memories | Violet | `violet-100`, `violet-700` |

## Typography

### Headlines

- **Hero H1**: `text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight`
- **Section H2**: `text-3xl md:text-4xl font-bold`
- **Card H3**: `text-xl font-bold` or `text-2xl font-bold`

### Body Text

- **Primary**: `text-lg md:text-xl font-light` (subheadlines)
- **Secondary**: `text-stone-600 dark:text-stone-400` (descriptions)
- **Muted**: `text-stone-500 dark:text-stone-500 text-sm` (hints, labels)

### Text Colors

- Headlines: `text-stone-900 dark:text-stone-50` (solid, no gradients)
- Body: `text-stone-600 dark:text-stone-400`
- Muted: `text-stone-500`

## Components

### Cards

**Standard Card:**
```tsx
<Card className="border border-stone-200 dark:border-stone-800 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
```

**Preview Card (no border, floating effect):**
```tsx
<div className="overflow-hidden rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
```

### Buttons

**Primary Button:**
```tsx
<Button className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white">
```

**Button Disabled State:** Grayed out, no hover effects

### Inputs

```tsx
<Input className="border-stone-300 dark:border-stone-700 focus:border-amber-500 dark:focus:border-amber-500" />
```

### Theme Selector (Visual Grid)

- Grid of visual swatches: `grid grid-cols-3 gap-2`
- Each swatch: `aspect-square rounded-lg border-2`
- Selected state: `border-amber-600 ring-2 ring-amber-600/20`
- Hover state: `hover:border-stone-300`
- Checkmark indicator on selected theme

### Icons

**Icon containers (feature sections):**
```tsx
<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
```

## Layout

### Container

```tsx
<div className="container mx-auto px-4">
<div className="max-w-7xl mx-auto">  // For main content
<div className="max-w-5xl mx-auto">  // For feature sections
```

### Grid (Desktop)

**Main layout (poster + form):**
```tsx
<div className="grid lg:grid-cols-[2fr_1fr] gap-8">
```

- Preview area: 66% (2fr)
- Form sidebar: 33% (1fr)

**Mobile:** Single column, preview first (`order-1`), form second (`order-2`)

### Spacing

- Section padding: `py-20`
- Card padding: `p-6`
- Element spacing: `space-y-4`, `space-y-6`, `gap-8`, `gap-12`

## Design Principles

### 1. Warm, Not Corporate

- Use earth tones (amber, stone, orange) instead of blue
- Soft shadows instead of hard borders
- Rounded corners everywhere

### 2. Art Studio Aesthetic

- Preview area dominates the page
- Floating poster effect with shadows
- Grid backgrounds for empty states (cartographic feel)

### 3. Mobile-First

- Preview always visible first on mobile
- Form as secondary element
- Touch-friendly theme selector

### 4. Premium Feel

- Subtle backdrop blur on cards
- Generous whitespace
- Minimal UI chrome

## Do's and Don'ts

### Do

- Use warm colors (amber, stone, orange)
- Use soft shadows (`shadow-lg`, `shadow-[0_8px_30px_...]`)
- Keep preview area prominent
- Use visual theme selection (not dropdowns)
- Write emotional, benefit-focused copy

### Don't

- Use blue gradients (too corporate/SaaS)
- Use hard borders (`border-2`)
- Hide the preview area
- Use generic tech-focused copy
- Use dropdown selects for visual choices
