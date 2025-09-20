# Type Safety Policy

This document outlines the type safety standards and workflow for the unplan codebase.

## 🚫 Core Rules

### 1. **No `any` Types**

**Rule:** Do not use the `any` type in TypeScript code.

```typescript
// ❌ Forbidden
function process(data: any) { ... }
const result = response as any;
let items: any[] = [];

// ✅ Preferred
function process(data: unknown) { ... }
const result = response as ResponseType;
let items: Item[] = [];
```

**Rationale:** `any` disables TypeScript's type checking, eliminating the benefits of static typing and increasing runtime error risk.

### 2. **Prefer `unknown` Then Narrow**

**Rule:** Use `unknown` for uncertain types, then narrow with type guards.

```typescript
// ✅ Safe pattern
function handleError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'toString' in error) {
    return String(error.toString());
  }
  return 'Unknown error';
}

// ✅ API response handling
function processApiResponse(response: unknown): ProcessedData {
  if (isValidResponse(response)) {
    return transformResponse(response);
  }
  throw new Error('Invalid API response');
}
```

### 3. **Documented `ts-expect-error` Only**

**Rule:** `ts-expect-error` is allowed only with descriptive comments (minimum 8 characters) and links to PR/issue.

```typescript
// ✅ Acceptable with documentation
// @ts-expect-error: Expo Router types incomplete for nested params - see PR #123
const params = useLocalSearchParams<ComplexParams>();

// ❌ Forbidden - no description
// @ts-expect-error
const result = api.call();
```

**Enforcement:** ESLint rule `@typescript-eslint/ban-ts-comment` with `minimumDescriptionLength: 8`.

## 📁 Code Organization

### 4. **External API Types in `lib/external/`**

**Rule:** Types for external APIs belong in dedicated modules under `lib/external/`.

```
lib/external/
├── otpTypes.ts      # OpenTripPlanner API types
├── osrmTypes.ts     # OSRM routing API types
└── overpassTypes.ts # Overpass API types (future)
```

**Benefits:**
- Single source of truth for external contracts
- Reusable across modules
- Clear separation of external vs internal types
- Easier to maintain when APIs change

### 5. **Minimal External Types**

**Rule:** Only define fields that the application actually uses.

```typescript
// ✅ Minimal - only used fields
export interface OtpResponse {
  error?: { msg?: string };
  plan?: { itineraries?: OtpItinerary[] };
}

// ❌ Excessive - unused fields add maintenance burden
export interface OtpResponse {
  error?: { msg?: string; code?: number; details?: any };
  plan?: { itineraries?: OtpItinerary[]; date?: string; from?: any; to?: any };
  requestParameters?: any;
  metadata?: any;
}
```

## 🔄 Development Workflow

### 6. **One File Per PR for Refactors**

**Rule:** Type safety refactoring PRs should focus on a single file.

**Benefits:**
- Easier code review
- Atomic changes
- Simpler rollback if needed
- Clear progress tracking

**Example PR titles:**
- `refactor: remove any types from utils/transitRouter.ts`
- `refactor: add type guards to lib/locationService.ts`

### 7. **CI Gates**

**Rule:** All PRs must pass strict type and lint checks.

**Required checks:**
```bash
npx tsc --noEmit --pretty false    # Zero TypeScript errors
npx eslint . --ext .ts,.tsx --max-warnings 0  # Zero ESLint warnings
```

**Enforcement:** GitHub Actions workflow blocks merge on failures.

## 🛠️ TypeScript Configuration

### 8. **Gradual Strictness**

**Current settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "useUnknownInCatchVariables": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true
  }
}
```

**Future considerations:**
- `exactOptionalPropertyTypes`: Distinguish `{ prop?: string }` from `{ prop?: string | undefined }`
- `noUncheckedIndexedAccess`: Require null checks for array/object access
- `noPropertyAccessFromIndexSignature`: Require bracket notation for dynamic access

## 📊 Progress Tracking

### Current Status
- ✅ **Core files cleaned**: 9 files refactored (Issue #25)
- ✅ **ESLint rules active**: Warns on new `any` usage
- ✅ **External types extracted**: OTP and OSRM types centralized
- ✅ **CI enforcement**: TypeScript and ESLint checks required

### Remaining Work
- 🔄 **Additional files**: ~6 files with `any` usage identified
- 🔄 **Advanced strictness**: Future TypeScript options
- 🔄 **Type coverage**: Measure and improve type coverage percentage

## 🎯 Enforcement

### ESLint Rules
```javascript
"@typescript-eslint/no-explicit-any": ["warn", { "ignoreRestArgs": false }],
"no-restricted-syntax": [
  "warn",
  {
    "selector": "TSAsExpression > TSAnyKeyword",
    "message": "Do not use 'as any'"
  }
],
"@typescript-eslint/ban-ts-comment": [
  "error",
  {
    "ts-expect-error": "allow-with-description",
    "minimumDescriptionLength": 8
  }
]
```

### Review Checklist
- [ ] No `any` types introduced
- [ ] `unknown` used with proper type guards
- [ ] External API types in `lib/external/`
- [ ] `ts-expect-error` has descriptive comment
- [ ] TypeScript compilation passes
- [ ] ESLint warnings addressed

---

**Last updated:** 2025-09-20  
**Next review:** When adding new external APIs or TypeScript options
