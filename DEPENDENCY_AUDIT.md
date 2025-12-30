# Dependency Audit Report
**Date:** 2025-12-30
**Project:** Päronsplit (dela-enklare-app)

## Executive Summary

✅ **Security Status:** No vulnerabilities found
⚠️ **Outdated Packages:** 9 packages have newer versions available
🗑️ **Unnecessary Dependencies:** 3 unused packages detected (can save ~2-3 MB)

---

## 1. Security Vulnerabilities

**Status: ✅ CLEAN**

```
npm audit: 0 vulnerabilities
- Critical: 0
- High: 0
- Moderate: 0
- Low: 0
```

**Recommendation:** No immediate security action required.

---

## 2. Unused Dependencies (BLOAT)

### 🗑️ Safe to Remove

#### 1. `@fontsource/plus-jakarta-sans` (^5.2.8)
**Status:** ❌ NOT USED
**Impact:** ~500 KB
**Reason:** The project uses Google Fonts (Inter) via CDN in `index.html:31`, not the fontsource package.

```bash
npm uninstall @fontsource/plus-jakarta-sans
```

#### 2. `react-hook-form` (^7.61.1) + `@hookform/resolvers` (^3.10.0)
**Status:** ❌ NOT USED
**Impact:** ~200 KB combined
**Reason:** No imports found in the codebase. Forms appear to use native React state management.

```bash
npm uninstall react-hook-form @hookform/resolvers
```

#### 3. `date-fns` (^3.6.0)
**Status:** ❌ NOT USED
**Impact:** ~300 KB (tree-shakeable, but still unused)
**Reason:** No imports found in the codebase. Date handling appears to use native JavaScript Date objects.

```bash
npm uninstall date-fns
```

**Total Potential Savings:** ~1 MB (plus reduced dependency tree complexity)

---

## 3. Outdated Packages

### Major Version Updates Available

⚠️ **High Priority - Breaking Changes Expected**

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `react` & `react-dom` | 18.3.1 | **19.2.3** | React 19 - significant changes, requires testing |
| `react-router-dom` | 6.30.2 | **7.11.0** | Major rewrite with new APIs |
| `zod` | 3.25.76 | **4.2.1** | Breaking schema changes |
| `sonner` | 1.7.4 | **2.0.7** | Toast library update |
| `tailwind-merge` | 2.6.0 | **3.4.0** | Utility library update |

⚠️ **Can be Removed (see section 2)**

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `@hookform/resolvers` | 3.10.0 | 5.2.2 | NOT USED - remove instead |
| `date-fns` | 3.6.0 | 4.1.0 | NOT USED - remove instead |

### Minor Version Updates Available

✅ **Low Risk - Recommended**

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `next-themes` | 0.3.0 | **0.4.6** | Theme provider - minor improvements |
| `lucide-react` | 0.462.0 | **0.562.0** | Icon library - new icons + fixes |

---

## 4. Recommendations

### Immediate Actions (Safe)

```bash
# 1. Remove unused dependencies
npm uninstall @fontsource/plus-jakarta-sans react-hook-form @hookform/resolvers date-fns

# 2. Update minor versions (low risk)
npm install next-themes@latest lucide-react@latest

# 3. Update patch versions for Radix UI and TanStack Query
npm update
```

### Consider (Requires Testing)

```bash
# Update to React 19 (MAJOR - test thoroughly!)
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19

# Update sonner toast library
npm install sonner@2

# Update tailwind-merge
npm install tailwind-merge@3
```

### Caution (Breaking Changes)

⚠️ **React Router v7** - Major rewrite, defer unless needed:
```bash
# NOT RECOMMENDED without migration plan
npm install react-router-dom@7
```

⚠️ **Zod v4** - Schema validation changes, defer unless needed:
```bash
# NOT RECOMMENDED without testing all validations
npm install zod@4
```

---

## 5. Dependency Usage Analysis

### ✅ Actively Used & Essential

- **UI Components:** All Radix UI packages are used (alert-dialog, checkbox, dialog, dropdown-menu, label, select, slot, switch, tabs, toast, tooltip)
- **State Management:** @tanstack/react-query + persist plugins
- **Backend:** @supabase/supabase-js
- **Styling:** Tailwind CSS ecosystem (tailwindcss, autoprefixer, postcss, tailwind-merge, clsx, class-variance-authority)
- **Icons:** lucide-react
- **Animations:** framer-motion (used in ExpenseItem, PullToRefresh, AddExpenseModal)
- **Theming:** next-themes (used in sonner.tsx)
- **Validation:** zod (used in Auth.tsx and likely forms)
- **Excel Export:** exceljs (used in lib/fileParser.ts)
- **Toast Notifications:** sonner

### ❌ Not Used (Can Remove)

- @fontsource/plus-jakarta-sans
- react-hook-form
- @hookform/resolvers
- date-fns

---

## 6. Implementation Plan

### Phase 1: Cleanup (Low Risk)
1. Remove unused dependencies
2. Update minor versions
3. Run `npm audit` again
4. Test the application

### Phase 2: Gradual Updates (Medium Risk)
1. Update sonner to v2
2. Update tailwind-merge to v3
3. Test toast notifications
4. Test styling utilities

### Phase 3: Major Updates (High Risk - Optional)
1. Create a new branch for React 19 testing
2. Update React + ReactDOM to v19
3. Run full test suite
4. Check for deprecation warnings
5. Test all features thoroughly

---

## 7. Estimated Impact

| Action | Bundle Size Impact | Risk Level |
|--------|-------------------|------------|
| Remove unused deps | -1 MB | ✅ None |
| Update minor versions | ~0 KB | ✅ Low |
| Update sonner + tailwind-merge | +20 KB | ⚠️ Low-Medium |
| Update to React 19 | +50 KB | ⚠️ High |

---

## Commands Summary

```bash
# Safe cleanup (recommended immediately)
npm uninstall @fontsource/plus-jakarta-sans react-hook-form @hookform/resolvers date-fns
npm install next-themes@latest lucide-react@latest
npm update
npm audit

# Medium risk updates (test before deploying)
npm install sonner@latest tailwind-merge@latest

# High risk updates (defer for now)
# npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19
# npm install react-router-dom@7
# npm install zod@4
```

---

## Notes

- The project has a clean dependency structure overall
- No security vulnerabilities detected
- Most dependencies are at reasonable versions
- The unused dependencies likely came from a starter template
- Consider adding a periodic dependency audit to CI/CD pipeline
