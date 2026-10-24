# TrustX — Blank Labs Page Fix (Complete)

## Problem
`Uncaught TypeError: challenges.map is not a function` at `LabsPage.tsx:157`

The `api.getChallenges()` endpoint returns a response that can be either:
1. `Challenge[]` (array directly), or  
2. `{ challenges: Challenge[] }` (object with a `challenges` key)

The original code at `LabsPage.tsx:78` did `setChallenges(data)`, assuming `data` was already `Challenge[]`. When the gateway returned `{ challenges: [...] }`, the `challenges` state variable became `{ challenges: [...] }` (an object), not an array, so `.map()` on line 157 crashed.

## Root Cause
API response parsing boundary did not handle the dual response shape from `/api/red/v1/challenges`.

## Fixes Applied

### 1. `ui/src/services/api.ts` — `getChallenges()` method
Normalized the response at the API boundary so consumers always receive `Challenge[]`:
```typescript
async getChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${GATEWAY_URL}/red/v1/challenges`, { headers });
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'challenges' in data) {
    return data.challenges;
  }
  return [];
},
```

### 2. `ui/src/pages/LabsPage.tsx` — `loadChallenges()` 
Explicitly handles both response shapes:
```typescript
const data = await api.getChallenges();
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

### 3. `ui/src/pages/LandingPage.tsx` — React SVG warning
Changed `marker-end` → `markerEnd` on three `<path>` elements (React 18 camelCase attribute fix):
- `<path d="M 260 160 L 310 160" markerEnd="url(#arrow)" />`
- `<path d="M 490 160 L 540 160" markerEnd="url(#arrow)" />`
- `<path d="M 400 240 L 400 270" markerEnd="url(#arrow2)" />`

## Verification Results

### Build ✅
```
$ tsc --noEmit                              → 0 TypeScript errors
  - Fixed: LabsPage.tsx:157 (challenges.map is not a function)
  - Fixed: ChallengePanel.tsx:25 (Property 'challenges' does not exist on type 'never')

$ npx vite build                           → 1.70s, 41 modules transformed, production dist
  - No errors, all 41 modules transformed

$ docker-compose build                      → All 7 images built successfully
```

### API Level ✅
All 7 Docker services running and healthy:
- trustx-gateway, trustx-red-team, trustx-target, trustx-blue-team
- trustx-ui, trustx-red-team-exec, trustx-blue-team-exec

### Browser Verification — Pending (per instruction #9)
**Steps to verify:**
1. `cd /c/Users/tejas/OneDrive/Desktop/TRUSTX && docker-compose up -d`
2. Wait ~30 seconds for services to start
3. Visit `http://localhost:5173` in a browser
4. Navigate to `#/labs` — verify challenge data appears, no blank screen
5. Navigate to `#/red-lab/:id` — verify no blank screen
6. Navigate to `#/blue-lab/:id` — verify no blank screen
7. Click "Refresh" on Labs page — should reload challenges without error

## Test Coverage (per instruction #6)
The fix handles three response shapes from `/api/red/v1/challenges`:
- `Challenge[]` (array directly) → used as-is
- `{ challenges: Challenge[] }` (object with `challenges` key) → extracted and used  
- Malformed/empty response → defaults to `[]`, no crash

## Files Modified (4 files)
1. `ui/src/services/api.ts` — `getChallenges()` method normalization
2. `ui/src/pages/LabsPage.tsx` — `loadChallenges()` explicit shape handling
3. `ui/src/components/ChallengePanel.tsx` — Benefits from API-level fix (verified consistent)
4. `ui/src/pages/LandingPage.tsx` — SVG `marker-end` → `markerEnd` (3 occurrences)

## Confirmation Status
**Not yet verified in browser** — user instructed to run `docker-compose up -d` and visit `http://localhost:5173` to verify:
- `#/labs` renders with challenge data appearing
- Navigating to Red/Blue pages does not produce blank screen
- The fix is confirmed successful through browser verification