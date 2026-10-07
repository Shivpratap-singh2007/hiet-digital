# HIET Digital Campus — Complete Dark Mode Implementation Report

## Executive Summary
This document outlines the root cause investigation, architectural design, component updates, and verification results for the dark mode feature in HIET Digital Campus (React + TypeScript + Vite + Tailwind CSS v4 + Supabase).

The solution preserves 100% of the approved UI/UX layout, typography, navigation, card hierarchy, and institutional identity (deep navy palette `#0b1322`, `#0f172a`, `#131d2e` rather than generic pitch black `#000000`).

---

## 1. Root Cause Analysis

Before this fix, selecting "Dark Mode" in Settings did not render the application dark due to several interacting factors:

1. **Tailwind CSS v4 Variant Compatibility:**
   - The application was upgraded to `@tailwindcss/vite` 4.3.x.
   - Tailwind v4 does not recognize legacy `@variant dark (&:where(...))` syntax without explicitly declaring `@custom-variant dark (&:where(.dark, .dark *));`.
   - Consequently, classes starting with `dark:...` were being omitted or not evaluated properly against the root document class.

2. **Decoupled Theme Context & State Mutation:**
   - Prior code was updating React local state or attempting local class toggling, but failed to reliably toggle `.dark` and `.light` directly on `document.documentElement` (`<html>`).
   - `style.colorScheme` was not being updated on `<html>`, which prevented native inputs, scrollbars, and system dialogues from adapting.

3. **White Flash on Page Refresh (FOUC):**
   - The theme was only initialized after React mounted, causing a harsh white screen flash before the saved theme preference could be read from storage.

4. **Hardcoded Non-Semantic Color Classes:**
   - Multiple top-level view shells and reusable cards utilized hardcoded background classes (`bg-white`, `bg-[#f8fafc]`, `text-slate-900`) without paired dark variants or semantic fallback rules, masking underlying CSS variables.

---

## 2. Theme Implementation Approach

### A. Root HTML Class & `colorScheme`
The theme is strictly applied to `document.documentElement`:
```ts
const root = window.document.documentElement;
root.classList.remove("light", "dark");

if (resolvedTheme === "dark") {
  root.classList.add("dark");
} else {
  root.classList.add("light");
}

root.style.colorScheme = resolvedTheme;
```
Resulting DOM:
- Dark Mode: `<html class="dark" style="color-scheme: dark">`
- Light Mode: `<html class="light" style="color-scheme: light">`

### B. Prevention of Light Flash on Refresh (`index.html`)
An inline script in the `<head>` of `index.html` resolves the theme before the DOM and JavaScript bundle load:
```html
<script>
  (function () {
    try {
      const storageKey = "hiet-digital-campus-theme";
      const savedTheme = localStorage.getItem(storageKey) || localStorage.getItem("hiet_theme_mode") || "system";
      const systemDark = window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedTheme =
        savedTheme === "dark" ||
        (savedTheme === "system" && systemDark)
          ? "dark"
          : "light";

      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(resolvedTheme);
      document.documentElement.style.colorScheme = resolvedTheme;
    } catch (error) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    }
  })();
</script>
```

### C. Centralized Theme Provider (`src/components/theme/ThemeProvider.tsx`)
A unified provider wraps the application root:
```tsx
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  themeMode: Theme; // backward compatibility
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  setThemeMode: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

---

## 3. Storage Key & Persistence

- **Primary LocalStorage Key:** `hiet-digital-campus-theme`
- **Fallback Compatibility Keys:** `hiet_theme_mode`, `hiet_theme`
- **Permitted Values:** `'light' | 'dark' | 'system'`
- **Persistence Verification:**
  - Persists across hard browser refresh.
  - Persists across route / tab switches.
  - Persists across login and logout cycles.
  - Persists across new browser sessions.

---

## 4. How System Mode Works

When `theme === 'system'`:
1. The app queries `window.matchMedia('(prefers-color-scheme: dark)')`.
2. If `matches` is `true`, `resolvedTheme` is `'dark'`, applying class `.dark` to `<html>`.
3. If `matches` is `false`, `resolvedTheme` is `'light'`, applying class `.light` to `<html>`.
4. A change event listener is actively registered:
   ```ts
   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
   const listener = (e: MediaQueryListEvent) => {
     const nextResolved = e.matches ? 'dark' : 'light';
     setResolvedTheme(nextResolved);
     applyThemeToDocument(nextResolved);
   };
   mediaQuery.addEventListener('change', listener);
   ```
5. When the user switches their OS theme between Light and Dark in Windows/macOS/iOS/Android settings, the app updates in real time without requiring a reload.
6. The listener is cleanly unsubscribed when changing out of `system` mode or unmounting.

---

## 5. Semantic Tokens & Institutional Color Palette

Configured in `src/index.css`:

### Light Tokens
- Background: `#f8fafc` (`--color-surface-soft`)
- Surface Cards: `#ffffff` (`--color-surface-card`)
- Primary Navy: `#0f2942`
- Text Primary: `#0f172a` (`--color-ink`)
- Hairline Border: `#e2e8f0` (`--color-hairline`)

### Dark Tokens (Institutional Navy Palette)
- Background Canvas: `#0b1322` (`--color-canvas`)
- Surface Cards: `#131d2e` (`--color-surface-card`)
- Header / Topbar: `#0f172a`
- Sidebar Background: `#070d19`
- Hairline Border: `#1e293b` (`--color-hairline`)
- Text Primary: `#f8fafc` (`--color-ink`)
- Text Muted: `#94a3b8` (`--color-mute`)
- Accent Cyan / Blue: `#38bdf8` / `#60a5fa` (high contrast on navy)

---

## 6. Components Updated

1. **`index.html`**
   - Injected FOUC prevention script in `<head>`.
   - Set dark background & text transition classes on `<body>`.

2. **`src/index.css`**
   - Configured `@custom-variant dark (&:where(.dark, .dark *));` for Tailwind v4.
   - Defined `:root, .light` and `.dark` design tokens.
   - Added `@theme` mapping for semantic color utilities.
   - Added `:where(...)` zero-specificity utility fallbacks for cards, text, and borders.

3. **`src/components/theme/ThemeProvider.tsx`**
   - Single source of truth for theme state, OS listener, and HTML element mutation.

4. **`src/context/ThemeContext.tsx`**
   - Re-exports `ThemeProvider`, `useTheme`, and relevant types.

5. **`src/App.tsx`**
   - Applied `dark:bg-[#0b1322] dark:text-slate-100` to both authenticated and unauthenticated root layouts.
   - Wrapped hierarchy with `<ThemeProvider>`.

6. **`src/components/common/Navbar.tsx`**
   - Added dark variants to sticky header (`dark:bg-[#0f172a]`), logo container, search input, notification bell, profile button, and logout modal.

7. **`src/components/common/Sidebar.tsx`**
   - Added dark styling for `<aside>` (`dark:bg-[#070d19]`), user pill, active/inactive nav links, and institutional footer.

8. **`src/components/common/StatCard.tsx`**
   - Added dark classes to card container (`dark:bg-[#131d2e]`), value text, icon container, subtext border, and all badge variants.

9. **`src/components/common/DataTable.tsx`**
   - Added dark classes to desktop table (`dark:bg-[#131d2e]`, `dark:border-slate-800`), header (`dark:bg-slate-900/60`), rows (`dark:divide-slate-800/80`), hover states, and mobile stacked cards.

10. **`src/components/common/SettingsView.tsx`**
    - Enhanced Appearance selector cards (Light, Dark, System) with active checkmarks and preview indicators.
    - Added dark classes to profile, security, and notification settings tabs.

11. **`src/components/common/NotificationsModal.tsx`**
    - Added dark styling to modal container, header, filter pills, and notification list items.

12. **`src/components/auth/LoginModal.tsx` & `PasswordInput.tsx`**
    - Added dark styles to login card, crest container, inputs, password visibility toggle, error banners, and links.

13. **`src/components/auth/StudentRegisterModal.tsx` & `TeacherRegisterModal.tsx`**
    - Added dark classes to verification cards, master database read-only details, inputs, and verification sent confirmation.

14. **`src/views/LandingPage.tsx`**
    - Added dark styling to institutional header, centered login card, inputs, footer, and About/Contact/Reset Password modals.

15. **`src/components/common/EmptyState.tsx`**
    - Added dark styling for empty state cards and action buttons.

---

## 7. Test Results

| Test Case | Expected Behavior | Result |
| :--- | :--- | :---: |
| **Select "Dark" in Settings** | Root `<html>` gets `class="dark"`, `colorScheme="dark"`; UI adopts navy palette | **PASS** |
| **Select "Light" in Settings** | Root `<html>` gets `class="light"`, `colorScheme="light"`; UI returns to clean white | **PASS** |
| **Select "System" in Settings** | Matches OS preference; reacts to OS theme changes via `matchMedia` listener | **PASS** |
| **Page Refresh (FOUC Test)** | Saved theme loads immediately without white flash on reload | **PASS** |
| **Persistence Across Tabs** | Theme remains intact after navigating between Home, Attendance, Settings, etc. | **PASS** |
| **Logout & Login Flow** | Selected theme persists on Landing Page and upon re-authenticating | **PASS** |
| **TypeScript Typecheck** | `tsc -b` completes with 0 errors | **PASS** |
| **Production Build** | `vite build` completes successfully; generates optimized CSS and JS bundles | **PASS** |

## 8. Neutral Black & White Dark Mode Update

> **Notice:** Dark palette updated to neutral black/white/gray.

The dark-mode color scheme was updated from a navy/blue-tinted dark mode to a premium neutral black-and-white aesthetic while keeping 100% of existing UI/UX and layout intact:

- **Main app background:** Near-black (`#0A0A0A`)
- **Sidebar:** Pure black (`#050505`), active item neutral charcoal (`#282828`), border (`#242424`), text (`#F0F0F0`)
- **Top Header:** Near-black (`#0A0A0A`), bottom border (`#2A2A2A`)
- **Cards & Data Tables:** Charcoal dark gray (`#141414`), borders (`#303030`), headers (`#1A1A1A`), hover rows (`#202020`)
- **Inputs & Forms:** Neutral dark gray (`#181818`), border (`#3A3A3A`), focus ring (`#D4D4D4`), text (`#F5F5F5`), placeholder (`#858585`)
- **Modals & Drawers:** Overlay (`rgba(0,0,0,0.65)`), panel (`#171717`), border (`#303030`)
- **Typography:** Near white (`#F5F5F5`), muted supporting text (`#A3A3A3`)
- **Controlled Accents:** Brand blue and red remain strictly confined to primary action buttons, small active nav indicators, and semantic status badges.
- **Light Mode:** 100% untouched and pristine.
- **Theme Persistence:** Persists across reloads, system sync, and login/logout transitions.

---

## Summary
The dark mode feature is fully operational, accessible, persistent, and seamlessly integrated into HIET Digital Campus with a crisp, neutral black/white/gray dark aesthetic without altering any approved UI layout, components, or spacing.
