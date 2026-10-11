# Editorial Architecture — Design System & Guidelines

## 1. Concept & Philosophy
The YourHealthFirst SEO Keyword CRM is designed under the philosophy of **"Editorial Architecture"**. It treats medical aesthetic keyword strategy with the typography, restraint, and deliberate pacing of high-end editorial and architectural monographs.

- **Zero AI Trope Slop**: No sparkles, lightbulbs, robots, "AI" badges, neon glows, glassmorphism blur, emoji, or rainbow gradients.
- **Tone**: Calm, authoritative, clinical, human.
- **Physicality**: The interface feels like ink printed onto heavy, archival paper (#F4F1EC), punctuated by precision 1px hairlines and clinical teal (#0F766E) accents.

---

## 2. Design Tokens

### Color Palette (Flat colors only)
- **Paper (Background)**: `#F4F1EC` (`--bg-paper`)
- **Paper Light (Panels / Inputs)**: `#FFFFFF` / `#FAF8F5`
- **Ink (Text & Dark Shell)**: `#0E0E0E` (`--text-ink`)
- **Ink Secondary**: `#4A4640` (`--text-muted`)
- **Hairline Rules**: `#E3DFD8` (`--border-hairline`)
- **Hairline Dark**: `#262626`
- **Clinical Teal Accent**: `#0F766E` (Strictly reserved for active indicators, progress bars, and deliberate calls to action)
- **Warning / Critical Limit**: `#B91C1C` (Hairline status on meta limit overflows)

### Typography
- **Display Serif**: `Instrument Serif` / `Fraunces` (Used for oversized numerals, page mastheads, editorial statements)
- **UI & Body**: `Inter` / `Geist Sans`
- **Numerals**: Tabular figures (`font-variant-numeric: tabular-nums`) applied to all search volumes, counts, and metrics.
- **Scale**:
  - Oversized Stat Numerals: `text-6xl` to `text-8xl` (tight tracking `-0.04em`)
  - Masthead Headings: `text-3xl` to `text-5xl`
  - Section Labels: `text-xs` uppercase tracking `0.15em`
  - Body: `text-sm` leading relaxed

---

## 3. Motion & Interaction Rules

- **Page Transitions**: 
  - Curtain / clip-path wipe transitions completed in under 500ms.
- **Physics**:
  - Spring-smoothed motion (stiffness 300, damping 30) for drag-and-drop cards and side panels.
- **Smooth Scroll**:
  - Lenis smooth scroll on tall editorial lists and dashboard views.
- **3D Keywords Skyline**:
  - Instanced meshes, matte flat-shaded materials, pointer-driven parallax.
  - Capped at DPR 1.5, pauses automatically when tab is hidden or off-screen.
- **Accessibility & Reduced Motion**:
  - `prefers-reduced-motion: reduce` unconditionally disables 3D canvas and spring animations, displaying crisp SVG / CSS fallbacks.
