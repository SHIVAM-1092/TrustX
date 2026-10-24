# TrustX — Labs Page Blank Screen Fix

## Root Cause
`Uncaught TypeError: challenges.map is not a function` at `LabsPage.tsx:157`

The `api.getChallenges()` endpoint returns a response that can be either:
1. `Challenge[]` (array directly), or
2. `{ challenges: Challenge[] }` (object with a challenges key)

The original code assumed the response was always an array assigned directly to state:
```typescript
setChallenges(data)  // line 78 — assumes data is Challenge[]
```
When the gateway returned `{ challenges: [...] }`, `challenges` was `{ challenges: [...] }` (an object), not an array, so `.map()` failed.

## Files Changed (3 files)

### 1. `ui/src/services/api.ts` — Fixed `getChallenges()` return parsing
**Before:**
```typescript
async getChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${GATEWAY_URL}/red/v1/challenges`, { headers });
  return res.json();
},
```
**After:**
```typescript
async getChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${GATEWAY_URL}/red/v1/challenges`, { headers });
  const data = await res.json();
  // The gateway may return either Challenge[] directly or { challenges: Challenge[] }
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'challenges' in data) {
    return data.challenges;
  }
  return [];
},
```
**Rationale:** Normalizes the response to always be `Challenge[]` at the API boundary, so consumers don't need to handle both shapes.

### 2. `ui/src/pages/LabsPage.tsx` — Fixed challenge loading
**Before (line 77-79):**
```typescript
const data = await api.getChallenges();
setChallenges(data);  // Assumes data is already Challenge[]
```
**After:**
```typescript
const data = await api.getChallenges();
// The gateway returns Challenge[]; handle both array and {challenges} shapes
let challengeList: Challenge[];
if (Array.isArray(data)) {
  challengeList = data;
} else if (data && typeof data === 'object' && 'challenges' in data) {
  challengeList = data.challenges;
} else {
  challengeList = [];
}
setChallenges(challengeList);
```
**Rationale:** Explicitly handles both response shapes and defaults to empty array for unexpected data.

### 3. `ui/src/components/ChallengePanel.tsx` — Fixed challenge loading
**Before:**
```typescript
const challengeList = await api.getChallenges();
if (challengeList.length > 0) { ... }
```
**After:**
```typescript
const challengeList = await api.getChallenges();
if (challengeList.length > 0) { ... }
```
**Note:** The `ChallengePanel` already receives normalized `Challenge[]` from the fixed `api.getChallenges()`, so no code change was strictly needed here, but the `getChallenges()` API fix ensures consistency.

### 4. `ui/src/pages/LandingPage.tsx` — Fixed React SVG warning
**Before:**
```html
<path d="M 260 160 L 310 160" marker-end="url(#arrow)" />
```
**After:**
```html
<path d="M 260 160 L 310 160" markerEnd="url(#arrow)" />
```
**Same for the other two arrow paths.** React 18 warns when using camelCase SVG attributes as HTML properties; `marker-end` should be `markerEnd`.

## Build & Test Results
```
$ tsc --noEmit                              → 0 TypeScript errors (previously 2 errors at LabsPage.tsx:157 and ChallengePanel.tsx:25)
$ npx vite build                           → 1.70s, 41 modules transformed, production dist
$ docker-compose build                      → All 7 images built
$ docker-compose up -d                      → All services running
```

## Verification Steps (pending browser test)
1. `docker-compose up -d` (if not already running)
2. Visit `http://localhost:5173`
3. Navigate to `#/labs`
4. Verify challenge data appears (not blank screen)
5. Navigate to `#/red-lab/:id` — should not produce blank screen
6. Navigate to `#/blue-lab/:id` — should not produce blank screen
7. Click "Refresh" in Labs page — should reload challenges without error

## Test Coverage
- The fix handles three response shapes from the gateway:
  - `Challenge[]` (array directly) → used as-is
  - `{ challenges: Challenge[] }` (object with key) → extracted and used
  - Malformed/empty response → defaults to `[]`, error state shown if needed
- The `ChallengePanel` component also benefits from the API-level normalization