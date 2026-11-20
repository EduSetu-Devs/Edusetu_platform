# 🔍 EduSetu Frontend Architecture, UI/UX & Accessibility Audit

**Audit Date:** November 2026  
**Auditor Role:** Principal Product Designer & Senior Frontend Architect  
**Project:** EduSetu (EdTech Communication & Marketplace Platform)  
**Status:** Stage 0 Complete — Audit & Discovery Phase

---

## 1. Executive Summary

EduSetu has a mature, feature-rich backend with SQLite/MySQL (TiDB) support, robust role-based access control (Student, Teacher, Parent, Admin), real-time WebSockets, AI safety guardrails, Brevo transactional email, and Firebase Google authentication.

However, the **frontend user experience currently reflects rapid iterative growth**:
- Styling relies on inline Tailwind classes with repeated patterns rather than centralized design primitives.
- Navigation relies on monolithic conditional rendering inside `App.jsx` (~790 lines) rather than a declarative router or structured shell layout.
- Inconsistent micro-states (loading spinners vs text, generic alert popups vs accessible toasts).
- High visual potential: Upgrading to a cohesive Stripe/Linear-grade design system will elevate EduSetu from a prototype/student-grade project to an **Enterprise SaaS platform**.

---

## 2. Technical Stack & Dependencies

| Area | Implementation | Notes / Observations |
|---|---|---|
| **Framework** | React 19 (`^19.2.8`) | Modern concurrent React. Functional components with hooks. |
| **Bundler & Build** | Vite 8 (`^8.2.2`) with `@vitejs/plugin-react` | Extremely fast builds (~1.7s - 2.0s). Chunking configured. |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite` `^4.3.3`) | Tailwind 4 CSS-first import `@import "tailwindcss";`. Fast, but lacks semantic token abstractions. |
| **Icons** | `lucide-react` (`^1.37.0`) | Consistent icon set across 30+ components. |
| **Motion & Animations** | `framer-motion` (`^12.0.0`) + CSS Keyframes | Installed, but currently underutilized in favor of simple CSS classes. |
| **Realtime** | `socket.io-client` (`^4.8.3`) | Socket connected per authenticated user room. |
| **Auth** | Firebase Auth (`^13.4.0`) + Axios HTTP-only cookie | Google popup auth + server-side JWT cookie verification. |
| **Testing** | Vitest (`^4.1.12`) + React Testing Library + `vitest-axe` | Automated a11y tests and component rendering tests. |
| **Linter** | Oxlint (`^1.79.0`) | Very fast linting; 0 errors, 123 warnings (mostly unused imports and `setState` in effect warnings). |

---

## 3. Architecture & Routing Analysis

### The `App.jsx` Monolith Pattern
Currently, `App.jsx` handles:
1. URL path parsing via custom `routeToView(pathname)`.
2. Browser `popstate` listening.
3. Rendering 30+ pages via `{currentView === 'xyz' && <Component />}`.
4. Managing shared state (`compareList`, `adminTab`, `backendHealth`).

**Impact on UX & Maintainability:**
- **No Shared Persistent App Shell:** Navigating between `student-dashboard`, `student-attendance`, and `student-homework` re-renders full containers rather than swapping inside an authenticated layout shell.
- **Scroll Position Flashes:** Custom view switching doesn't always manage scroll restoration cleanly.
- **Deep-linking Limitations:** Sub-tabs and modal states are tracked in component memory rather than query parameters.

---

## 4. Design Inconsistencies & UX Deficits

### A. Lack of Centralized Design Primitives
- **Buttons:** Every page implements custom button classes:
  - Some use `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md`.
  - Others use `bg-blue-600 hover:bg-blue-700 rounded-lg`.
  - Admin uses `bg-purple-600 hover:bg-purple-700`.
- **Form Inputs:** Input padding, focus rings, border radiuses, and error styles vary across `LoginPage`, `RegisterPage`, `FindTutorsPage`, and dashboard forms.
- **Cards & Containers:** Background opacities (`bg-white/80`, `bg-white`, `bg-slate-50`) and border opacities (`border-slate-200/60`, `border-slate-100`) lack a uniform elevation scale.

### B. Feedback & Notification UX
- Error messages on some pages use native `alert()` or raw red text divs.
- Success notifications disappear abruptly or require full page refreshes.
- Absence of a global **Toast Notification Provider** (`sonner` or lightweight accessible toast system).

### C. State Handling
| State Type | Current State | Required Enterprise UX |
|---|---|---|
| **Loading** | Generic `<Loader2 className="animate-spin" />` in center of page. | Content-shaped **Skeleton loaders** with smooth pulse animation. |
| **Empty** | Plain text: *"No records found"*. | Illustrated, actionable empty states with primary action CTA. |
| **Error** | Plain red error banner with retry button. | Structured error boundary with diagnostic message, support link, and retry action. |

---

## 5. Accessibility (WCAG 2.2 AA) Audit

- **Positive:** `vitest-axe` tests exist and pass for `Footer.jsx` and `RoleCard.jsx`.
- **Issues to Resolve:**
  1. **Focus States:** Many interactive elements lack prominent `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` indicators.
  2. **Reduced Motion:** Animations (`animate-fade-up`, `animate-float`) currently run regardless of user's `prefers-reduced-motion` settings.
  3. **Form Labels & Error Associations:** Some inputs use placeholders as labels or lack `aria-describedby` linking to validation error text.
  4. **Color Contrast:** Low-contrast text in badges (e.g. `text-slate-400` on light gray backgrounds).

---

## 6. Functional Capabilities That Must Be Preserved (Zero-Breakage Guarantee)

The modernization must preserve 100% of the following working integrations:
1. **Google OAuth & Firebase Auth:** `signInWithGoogle()` popups with backend JWT cookies.
2. **Brevo Email OTP:** 6-digit verification code delivery with backend cooldown timer.
3. **Role-Based Routing:** Strict RBAC preventing student/teacher access to `/admin` routes.
4. **AI Study Assistant & Guardrails:** Prompt injection defense, self-harm hotline intercept, Hinglish toxicity masking.
5. **Real-time WebSockets:** Student-Parent-Teacher messaging rooms.
6. **Marketplace & Tutor Recommendation Engine:** City/subject filtering and distance scoring.
7. **Document Generation:** PDF Report Card and Certificate generators.
8. **Homework & Attendance Tracking:** Multi-role attendance markers and submission file uploads.
