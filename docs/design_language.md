# Design Language Documentation

> **Superseded.** This documents the pre-Kartly `primary`/`secondary`/`accent`
> token set defined in `tailwind.config.js` — which Tailwind v4 never read in
> the first place (no `@config` directive), and which has since been deleted.
> The live design system is the Kartly token layer in `src/index.css` (`--k-*`
> custom properties + the Tailwind `@theme` block). See
> `docs/KARTLY_UI_PLAN.md` and `docs/KARTLY_MIGRATION_NOTES.md` for the
> current source of truth. Kept for historical reference only.

## Overview
This document outlines the design language and guidelines for the project. It serves as a reference for maintaining consistency in the design and user interface across the application.

---

## Color Palette
The following color palette is used throughout the application:

- **Primary Color**: `#A78BFA` (Light Purple)
- **Secondary Color**: `#F3F4F6` (Light Gray)
- **Accent Color**: `#4C1D95` (Dark Purple)
- **Background Color**: `#F9FAFB` (Light Background)
- **Text Color**: `#1F2937` (Dark Text)

---

## Typography
- **Font Family**: Use the font specified in the `Fonts.txt` file located in the `flat-design-coworking-app-template` folder.
- **Font Sizes**:
  - Headings: Use `text-2xl` for main headings and `text-lg` for subheadings.
  - Body Text: Use `text-sm` or `text-base` for regular text.

---

## Components

### Buttons
- **Style**:
  - Rounded edges: `rounded-lg`
  - Minimal shadows: `shadow-md`
  - Primary button: `bg-primary text-white hover:bg-accent`

### Cards
- **Style**:
  - Rounded edges: `rounded-lg`
  - Minimal shadows: `shadow-md`
  - Single-line border: `border border-gray-200`

### Icons
- Use the React Icons library for all icons.
- Icons should have a size of `24px` and use the primary color (`text-primary`).

---

## Layout
- **Spacing**:
  - Use `p-4` for padding inside containers.
  - Use `space-y-4` for vertical spacing between elements.
- **Alignment**:
  - Center content using `flex items-center justify-center` for full-page layouts.

---

## Responsive Design
- Ensure all components and pages are responsive.
- Use Tailwind's responsive utilities (e.g., `sm:`, `md:`, `lg:`) to adjust styles for different screen sizes.

---

## Design Inspiration
The design is inspired by the template provided in the `flat-design-coworking-app-template` folder. Refer to the attached image for visual guidance.

---

## Next Steps
1. Follow this document for all design-related decisions.
2. Update this document as new design elements are introduced.
3. Ensure all developers and designers refer to this document for consistency.