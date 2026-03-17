# Design Guidelines - glam-lavish

**Last Updated:** 2026-03-15
**Status:** Pending — No HTML prototypes available yet

This document will contain comprehensive design system guidelines once HTML prototypes are created. Use Tailwind CSS defaults until then.

---

## Recommended Defaults

### Color System
- **Primary**: Tailwind `indigo-600` / `#4f46e5`
- **Background**: `white` / `gray-50`
- **Text**: `gray-900` (primary), `gray-500` (secondary)
- **Success**: `green-500`
- **Warning**: `amber-500`
- **Error**: `red-500`

### Typography
- **Font Family**: Inter (via Google Fonts) or system font stack
- **Sizes**: Tailwind defaults (text-sm, text-base, text-lg, etc.)

### Layout
- **Max Width**: `max-w-7xl` for main content
- **Spacing**: Tailwind spacing scale (4px base unit)
- **Border Radius**: `rounded-lg` for cards, `rounded-md` for inputs

### Components
- Use shadcn/ui or Headless UI for common patterns
- Consistent table styling with Tailwind
- Form inputs with proper validation states

---

> **Note:** This file will be fully populated when HTML prototypes are designed. Run `/dev:gap-finder` after adding prototypes to auto-extract design tokens.
