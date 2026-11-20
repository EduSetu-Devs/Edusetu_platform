# 📐 EduSetu Premium SaaS Design System Specification

**Standard:** WCAG 2.2 AA Compliant | Enterprise SaaS Standard  
**Inspirations:** Stripe, Linear, Vercel  
**Design Philosophy:** Function over decoration, clean typography, purposeful micro-interactions, subtle layered depth.

---

## 1. Color Palette & Semantic Tokens

### Core Colors
```css
:root {
  /* Brand Tokens */
  --color-brand-primary: #4f46e5;       /* Deep Indigo */
  --color-brand-primary-hover: #4338ca;
  --color-brand-primary-light: #eef2ff;

  --color-brand-secondary: #7c3aed;     /* Electric Violet */
  --color-brand-secondary-hover: #6d28d9;
  
  --color-brand-accent: #0d9488;        /* Emerald Teal */
  --color-brand-accent-light: #f0fdfa;

  /* Surfaces & Backgrounds */
  --color-bg-canvas: #f8fafc;           /* Neutral Slate Canvas */
  --color-bg-surface: #ffffff;          /* Card / Modal Surface */
  --color-bg-muted: #f1f5f9;            /* Subdued Fill */

  /* Text & Typography */
  --color-text-primary: #0f172a;        /* Deep Slate 900 */
  --color-text-secondary: #475569;      /* Slate 600 */
  --color-text-muted: #94a3b8;          /* Slate 400 */
  --color-text-inverse: #ffffff;

  /* Borders & Dividers */
  --color-border-subtle: #f1f5f9;       /* Slate 100 */
  --color-border-default: #e2e8f0;      /* Slate 200 */
  --color-border-strong: #cbd5e1;       /* Slate 300 */
  --color-border-focus: #4f46e5;

  /* Semantic Feedback */
  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --color-info: #0284c7;
  --color-info-bg: #f0f9ff;
}
```

---

## 2. Typography Hierarchy

| Style Token | Size / Line-height | Weight | Usage |
|---|---|---|---|
| **Display Heading** | 48px / 1.1 | 800 (Extrabold) | Hero headline, marketing titles |
| **Page Heading (H1)** | 30px / 1.25 | 700 (Bold) | Main Dashboard title |
| **Section Heading (H2)**| 22px / 1.3 | 600 (Semibold) | Card sections, drawer headers |
| **Component Title (H3)**| 16px / 1.4 | 600 (Semibold) | Widget titles, table column headers |
| **Body Large** | 16px / 1.5 | 400 (Regular) | Primary content, lead text |
| **Body Regular** | 14px / 1.5 | 400 (Regular) | Default table text, input labels, descriptions |
| **Caption / Subtext** | 12px / 1.4 | 500 (Medium) | Timestamps, metadata pills, micro-copy |

---

## 3. Elevation & Depth Scale

- **Surface Level 0 (Canvas):** Flat `#f8fafc`.
- **Surface Level 1 (Card Default):** `#ffffff` with `border: 1px solid #e2e8f0` and `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05)`.
- **Surface Level 2 (Card Hover / Active Widget):** `box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)`.
- **Surface Level 3 (Dropdown / Popover):** `box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`.
- **Surface Level 4 (Modal / Dialog):** `box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)` with backdrop blur `backdrop-blur-sm bg-slate-900/40`.

---

## 4. Reusable Component Primitives Checklist

### 1. `Button` (`src/components/ui/Button.jsx`)
- **Variants:** `primary` (Indigo), `secondary` (Outline Slate), `ghost`, `danger`, `accent` (Teal).
- **Sizes:** `sm` (h-8), `md` (h-10), `lg` (h-12).
- **States:** Default, Hover, Active, Focus-visible, Loading (with accessible spinner), Disabled.

### 2. `Input` & `FormField` (`src/components/ui/Input.jsx`)
- Floating/standard label, helper text, error text (`aria-invalid`, `aria-describedby`).
- Icon prefix and suffix support (e.g. search icon, password visibility toggle).

### 3. `Card` & `BentoGrid` (`src/components/ui/Card.jsx`)
- Clean bordered white cards with consistent padding (`p-6` desktop, `p-4` mobile).
- Optional header, body, and footer slots.

### 4. `Badge` (`src/components/ui/Badge.jsx`)
- Soft-tinted semantic badges: `success` (green), `warning` (amber), `danger` (rose), `info` (sky), `brand` (indigo).

### 5. `ToastProvider` (`src/components/ui/Toast.jsx`)
- Screen-reader friendly announcements (`aria-live="polite"`).
- Auto-dismiss with progress indicator and manual close button.

### 6. `SkeletonLoader` (`src/components/ui/Skeleton.jsx`)
- Shapes: `text`, `circle` (avatar), `rect` (card/chart placeholder).
- Replaces harsh jarring spinners with content-shaped shimmer animations.
