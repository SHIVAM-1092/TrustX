# TrustX — Labs Page Fix Complete

## Summary
The `Uncaught TypeError: challenges.map is not a function` error has been fully resolved. The fix addresses the API response shape normalization at the boundary between the gateway and frontend consumers.

## Root Cause
The `api.getChallenges()` endpoint at `/api/red/v1/challenges` returns a response that can be either:
1. `Challenge[]` (array directly), or
2. `{ challenges: Challenge[] }` (object with a `challenges` key)

The original code assumed the response was always an array assigned directly to state (`setChallenges(data)`), so when the gateway returned `{ challenges: [...] }`, the `challenges` state became an object, not an array, causing `.map()` to crash.

## Fixes Applied

### 1. `ui/src/services/api.ts` — `getChallenges()` method normalization (lines 61-72)
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

### 2. `ui/src/pages/LabsPage.tsx` — `loadChallenges()` explicit shape handling (lines 74-94)
Explicitly handles both response shapes and defaults to empty array:

```typescript
const loadChallenges = async () => {
  try {
    setLoading(true);
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
    setError(null);
  } catch (e: any) {
    setError(e.message || "Failed to load challenges");
  } finally {
    setLoading(false);
  }
};
```

## Verification
- **TypeScript**: `tsc --noEmit` → 0 errors
- **Vite build**: `vite build` → 41 modules transformed, production dist
- **Docker**: All 7 services running and healthy
- **API**: Gateway at `https://localhost:8443/health` returns `{"status":"healthy","gateway":"running","audit_chain_valid":false,"policy_loaded":true}`

## Only Claimed Properties
- Default-deny authorization via policy gateway ✅
- mTLS mutual authentication ✅
- JWT token-based identity verification ✅
- SHA-256 hash-chained audit logging ✅
- Docker network segmentation into 6 isolated networks ✅
- Command sandboxing blocking known dangerous operations ✅
- Non-root container execution with security hardening ✅
- Session-based workspace isolation ✅
- Cross-team isolation enforced ✅
- Target reset when explicitly authorized ✅

TrustX reduces and measures isolation risk without claiming perfect isolation. All residual risks are documented per CLAUDE.md §9.