# Dependency Audit Report
**Date:** 2025-12-28
**Project:** dela-enklare-app
**Total Dependencies:** 70 production + dev dependencies
**Node Modules Size:** 296 MB
**Bundle Size:** 1,102 KB (343 KB gzipped)

---

## 🚨 CRITICAL SECURITY VULNERABILITIES

### 1. **xlsx** (HIGH - No Fix Available)
- **Current Version:** 0.18.5
- **Severity:** HIGH
- **Issues:**
  - Prototype Pollution (CVE GHSA-4r6h-8v6p-xvw6)
  - Regular Expression Denial of Service (ReDoS) (CVE GHSA-5pgg-2g8v-p4x9)
- **Fix Available:** ❌ No (latest 0.18.5 still vulnerable, need 0.19.3+ or 0.20.2+)
- **Recommendation:** **URGENT** - Replace with alternative library like `exceljs` or upgrade to non-vulnerable version

### 2. **vite** (MODERATE - Fixable)
- **Current Version:** 5.4.19
- **Severity:** MODERATE
- **Issues:**
  - File system bypass vulnerabilities
  - Middleware security issues
- **Fix Available:** ✅ Yes - upgrade to 6.1.7+
- **Recommendation:** Upgrade to latest Vite 6.x

### 3. **glob** (HIGH - Fixable)
- **Severity:** HIGH
- **Issue:** Command injection via CLI
- **Fix Available:** ✅ Yes - upgrade to 10.5.0+
- **Recommendation:** Run `npm audit fix`

### 4. **esbuild** (MODERATE - Fixable)
- **Severity:** MODERATE
- **Issue:** Development server request vulnerability
- **Fix Available:** ✅ Yes - upgrade to 0.24.3+
- **Recommendation:** Run `npm audit fix`

### 5. **js-yaml** (MODERATE - Fixable)
- **Severity:** MODERATE
- **Issue:** Prototype pollution in merge
- **Fix Available:** ✅ Yes - upgrade to 4.1.1+
- **Recommendation:** Run `npm audit fix`

---

## 📦 OUTDATED PACKAGES

### Major Version Updates Available

| Package | Current | Latest | Breaking? |
|---------|---------|--------|-----------|
| **react** | 18.3.1 | 19.2.3 | ⚠️ Yes - Major |
| **react-dom** | 18.3.1 | 19.2.3 | ⚠️ Yes - Major |
| **@hookform/resolvers** | 3.10.0 | 5.2.2 | ⚠️ Yes - Major |
| **date-fns** | 3.6.0 | 4.1.0 | ⚠️ Yes - Major |
| **react-router-dom** | 6.30.1 | 7.11.0 | ⚠️ Yes - Major |
| **zod** | 3.25.76 | 4.2.1 | ⚠️ Yes - Major |
| **react-day-picker** | 8.10.1 | 9.13.0 | ⚠️ Yes - Major |
| **recharts** | 2.15.4 | 3.6.0 | ⚠️ Yes - Major |
| **sonner** | 1.7.4 | 2.0.7 | ⚠️ Yes - Major |
| **tailwind-merge** | 2.6.0 | 3.4.0 | ⚠️ Yes - Major |
| **vaul** | 0.9.9 | 1.1.2 | ⚠️ Yes - Major |
| **react-resizable-panels** | 2.1.9 | 4.0.15 | ⚠️ Yes - Major |

### Minor/Patch Updates

| Package | Current | Latest |
|---------|---------|--------|
| **lucide-react** | 0.462.0 | 0.562.0 |
| **next-themes** | 0.3.0 | 0.4.6 |

---

## 🗑️ UNNECESSARY BLOAT

### Unused UI Components (38 out of 48 - 79% unused!)

The following UI component files exist but are **NEVER imported** in the application:

**High Priority for Removal:**
- accordion, avatar, badge, breadcrumb, calendar
- carousel, chart, collapsible, command, context-menu
- drawer, form, hover-card, input-otp, menubar
- navigation-menu, pagination, popover, progress
- radio-group, resizable, scroll-area, select
- separator, sheet, sidebar, skeleton, slider
- sonner, table, textarea, toast, toaster
- toggle, toggle-group, tooltip, aspect-ratio

**Corresponding Radix UI packages that could be removed:**
- `@radix-ui/react-accordion`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`

**Potential dependency savings:** ~18 Radix UI packages + their transitive dependencies

### Currently Used UI Components (10/48 - 21%)

**Actually imported and used:**
- alert-dialog
- button (most used - 16 imports)
- card
- checkbox
- input (7 imports)
- label (6 imports)
- switch
- tabs
- use-toast
- dialog (via wrapper components)

### Other Dependencies Analysis

**Dependencies in use:**
- ✅ `framer-motion` - Used for animations (6 occurrences)
- ✅ `@supabase/supabase-js` - Backend integration
- ✅ `@tanstack/react-query` - Data fetching
- ✅ `react-hook-form` + `@hookform/resolvers` - Forms
- ✅ `date-fns` - Date handling
- ✅ `lucide-react` - Icons
- ✅ `xlsx` - Excel import (⚠️ has vulnerabilities)
- ✅ `tailwindcss` + utilities - Styling

**Potentially unused or rarely used:**
- ⚠️ `recharts` - Used only in chart.tsx (which is unused)
- ⚠️ `embla-carousel-react` - Used only in carousel.tsx (which is unused)
- ⚠️ `cmdk` - Used only in command.tsx (which is unused)
- ⚠️ `input-otp` - Used only in input-otp.tsx (which is unused)
- ⚠️ `vaul` - Used only in drawer.tsx (which is unused)
- ⚠️ `react-resizable-panels` - Used only in resizable.tsx (which is unused)
- ⚠️ `react-day-picker` - Used only in calendar.tsx (which is unused)

---

## 📊 BUNDLE SIZE ANALYSIS

**Current Build Output:**
```
dist/assets/index-dErHmjVR.js   1,102.21 kB │ gzip: 343.06 kB
```

⚠️ **Warning:** Bundle exceeds 500 KB recommendation

**Estimated savings from removing unused dependencies:**
- Removing unused Radix UI packages: ~80-100 KB
- Removing unused utilities (recharts, embla, etc.): ~150-200 KB
- **Potential total savings: 250-300 KB (25-30% reduction)**

---

## ✅ RECOMMENDATIONS

### Immediate Actions (High Priority)

1. **🚨 Fix xlsx vulnerability (CRITICAL)**
   ```bash
   # Option 1: Upgrade to safe version (if possible)
   npm install xlsx@latest  # Check if 0.20.2+ available

   # Option 2: Replace with exceljs
   npm uninstall xlsx
   npm install exceljs
   # Update src/lib/fileParser.ts to use exceljs instead
   ```

2. **Fix other security vulnerabilities**
   ```bash
   npm audit fix --force
   ```

3. **Remove unused UI components and dependencies**
   ```bash
   # Remove unused component files
   rm src/components/ui/{accordion,avatar,badge,breadcrumb,calendar,carousel,chart,collapsible,command,context-menu,drawer,form,hover-card,input-otp,menubar,navigation-menu,pagination,popover,progress,radio-group,resizable,scroll-area,select,separator,sheet,sidebar,skeleton,slider,sonner,table,textarea,toast,toaster,toggle,toggle-group,tooltip,aspect-ratio}.tsx

   # Remove unused dependencies
   npm uninstall @radix-ui/react-accordion @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-hover-card @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip recharts embla-carousel-react cmdk input-otp vaul react-resizable-panels react-day-picker
   ```

### Medium Priority Actions

4. **Upgrade Vite to v6** (security + performance)
   ```bash
   npm install -D vite@latest
   # Test thoroughly after upgrade
   ```

5. **Update browserslist data**
   ```bash
   npx update-browserslist-db@latest
   ```

6. **Consider upgrading to React 19** (when ready)
   - Review breaking changes: https://react.dev/blog/2024/04/25/react-19
   - Test thoroughly in development first
   - Update react and react-dom together:
   ```bash
   npm install react@latest react-dom@latest
   ```

### Long-term Improvements

7. **Implement code splitting**
   - Use dynamic imports for routes
   - Lazy load heavy components
   - Target: <250 KB initial bundle

8. **Regular dependency maintenance**
   - Run `npm outdated` monthly
   - Run `npm audit` weekly
   - Keep dependencies within 1 major version of latest

9. **Consider dependency alternatives**
   - If Radix UI is overkill, consider headless UI or Ark UI
   - Evaluate if all UI framework features are needed

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Replace or upgrade `xlsx` package (CRITICAL)
- [ ] Run `npm audit fix` to fix security vulnerabilities
- [ ] Remove 38 unused UI component files
- [ ] Uninstall 25+ unused dependencies
- [ ] Upgrade Vite to v6.x
- [ ] Update browserslist data
- [ ] Test application thoroughly
- [ ] Rebuild and verify bundle size reduction
- [ ] Update documentation
- [ ] Plan React 19 upgrade (future)

---

## Expected Outcomes

After implementing all recommendations:

- ✅ **0 security vulnerabilities** (down from 5)
- ✅ **~150 MB smaller node_modules** (down from 296 MB)
- ✅ **25-30% smaller bundle** (~250-280 KB gzipped vs 343 KB)
- ✅ **Faster install times**
- ✅ **Faster builds**
- ✅ **Easier maintenance**
- ✅ **Better security posture**
