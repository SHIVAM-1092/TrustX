# TrustX — 10 Lab Implementation Plan

## Current State
- **Red Team**: 1 challenge (prompt-injection-1) - Beginner difficulty
- **Blue Team**: 6 UI templates only (no backend challenge validation, no flags, no server-side completion)

## Target State
- **Red Team**: 5 challenges (1 Easy, 2 Intermediate, 2 Advanced)
- **Blue Team**: 5 challenges (1 Easy, 2 Intermediate, 2 Advanced)

## Implementation Strategy

### Phase 1: Challenge Registry Framework
Create a shared challenge registry module that can be used by both Red and Blue team services.

### Phase 2: Red Team Challenges (5 total)
1. **EASY** - Linux Reconnaissance (red-team-exec based)
   - Challenge ID: `linux-recon-1`
   - Use execution environment to explore local target
   - Discover flag through file enumeration

2. **INTERMEDIATE** - Web Authentication Weakness (red-team-exec + target)
   - Challenge ID: `web-auth-bypass-1`
   - Local vulnerable web app via red-team-exec
   - Exploit auth weakness, verify access to protected resource

3. **INTERMEDIATE** - Web Input Validation (red-team-exec + target)
   - Challenge ID: `web-input-validation-1`
   - SQL injection / XSS on local training endpoint
   - Demonstrate impact with seeded data

4. **ADVANCED** - Multi-Stage Web Attack Chain (red-team-exec + target)
   - Challenge ID: `web-attack-chain-1`
   - Combine 2+ weaknesses (e.g., info disclosure + auth bypass)
   - Require evidence from earlier stages

5. **ADVANCED** - Linux Privilege Escalation Investigation (red-team-exec)
   - Challenge ID: `linux-privesc-1`
   - Deliberately vulnerable unprivileged environment
   - Identify specific misconfiguration, demonstrate impact

### Phase 3: Blue Team Challenges (5 total)
1. **EASY** - Security Log Triage (blue-team-exec)
   - Challenge ID: `log-triage-1`
   - Analyze seeded auth.log, identify suspicious event
   - Submit evidence via terminal commands

2. **INTERMEDIATE** - Brute-Force Detection (blue-team-exec)
   - Challenge ID: `bruteforce-detection-1`
   - Seeded auth logs with multiple IPs, timestamps
   - Identify source, timeframe, affected account

3. **INTERMEDIATE** - Web Attack Investigation (blue-team-exec)
   - Challenge ID: `web-attack-investigation-1`
   - Seeded web access/error logs
   - Correlate suspicious requests, status codes, timestamps

4. **ADVANCED** - Incident Timeline Reconstruction (blue-team-exec)
   - Challenge ID: `incident-timeline-1`
   - Multiple seeded log sources
   - Reconstruct multi-stage incident, identify initial event

5. **ADVANCED** - Detection Engineering and Response (blue-team-exec)
   - Challenge ID: `detection-engineering-1`
   - Simulated multi-stage attack telemetry
   - Create/select detection rule, validate against malicious/benign

### Phase 4: Backend Integration
- Add challenge endpoints to red-team/main.py (list, get, attack, reset)
- Add challenge endpoints to blue-team/main.py (or create blue-team/challenge.py)
- Update gateway policy if needed for challenge routes
- Ensure flag format: `KALI{...}`

### Phase 5: UI Integration
- Update LabsPage.tsx to display all challenges from API
- Update RedTeamLab.tsx to support multiple challenges
- Update BlueTeamLab.tsx to support challenge validation
- Add challenge workspace for Blue Team

### Phase 6: Testing
- Unit tests for each challenge validator
- Integration tests for challenge flow
- Security boundary tests
- Reset/cleanup tests

## Files to Create/Modify

### New Files
- `red-team/challenges/` - Directory for Red Team challenge implementations
- `blue-team/challenges/` - Directory for Blue Team challenge implementations
- `trustx/challenges/registry.py` - Shared challenge registry
- `trustx/challenges/base.py` - Base challenge classes

### Modified Files
- `red-team/challenge.py` - Extend to support multiple challenges
- `red-team/main.py` - Update challenge listing/routing
- `blue-team/main.py` - Add challenge endpoints
- `ui/src/pages/LabsPage.tsx` - Display all challenges
- `ui/src/pages/RedTeamLab.tsx` - Support multiple challenges
- `ui/src/pages/BlueTeamLab.tsx` - Support multiple challenges with validation

## Difficulty Mapping
| Team | Easy (1) | Intermediate (2) | Advanced (2) |
|------|----------|------------------|--------------|
| Red  | linux-recon-1 | web-auth-bypass-1, web-input-validation-1 | web-attack-chain-1, linux-privesc-1 |
| Blue | log-triage-1 | bruteforce-detection-1, web-attack-investigation-1 | incident-timeline-1, detection-engineering-1 |

## Flag Format
All flags: `KALI{<challenge_id>-<short_hash>}` - generated server-side per learner

## Security Requirements
- Flags never in frontend code, public metadata, or logs
- Server-side validation only
- Cross-team isolation maintained
- No privileged containers
- Session-based workspace isolation