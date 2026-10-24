# TrustX — Permanent Project Instructions

## 1. Project identity

TrustX is our Hack in Hills '26 Round 2 prototype for Bayora's problem statement: Securing Adversarial AI Safety Testing Infrastructure.

Team: Apex Intelligence.

Tagline: Isolate the teams. Protect the target. Prove the boundary.

The goal is to build a functional, demonstrable prototype—not merely a UI mockup, architecture diagram, or collection of disconnected code files.

## 2. Source of truth

Before implementing any feature, inspect this file and the relevant project documentation.

Read the original Round 1 proposal from `docs/reference/TrustX-Round1-Proposal.pptx` when available.

Preserve the proposal's terminology, intended architecture, security requirements, proposed evaluation metrics, and stated limitations.

Distinguish:
- Requirements from the original proposal
- Features actually implemented
- Features actually tested
- Future plans and unimplemented features

Do not invent evidence or silently turn proposed features into claims of completed functionality.

## 3. Core architecture

TrustX separates three security domains:

### Red Team
Runs synthetic adversarial testing workloads and maintains independent state.

### Target
Represents a synthetic, resettable target LLM service. It must not expose Red or Blue internal state.

### Blue Team
Runs synthetic defensive testing workloads and maintains independent state.

### Policy gateway
Enforces server-side authorization, validates service identity, makes allow/deny decisions, and records audit events.

Security boundaries must be enforced by backend and infrastructure controls, not just by the frontend or AI instructions.

## 4. Security requirements

- Default-deny authorization.
- Fail closed when identity or policy validation fails.
- Do not trust caller-controlled parameters or ordinary headers as proof of identity.
- Red-to-Blue and Blue-to-Red access must be denied.
- Target-to-Red and Target-to-Blue access must be denied.
- Red-to-Target requests are allowed only under explicit policy.
- Blue-to-Target requests are controlled by explicit policy.
- Validate malformed requests, unknown domains, identity spoofing and unauthorized reset attempts.
- Configure and test network segmentation.
- Keep domain state and secrets separate.
- Maintain structured audit events and a verifiable SHA-256 hash chain.
- Document that a hash chain detects changes relative to a trusted chain state but does not independently prevent full-log rewriting.
- Do not expose the development service publicly by default.

## 5. Engineering standards

- Inspect existing files before changing them.
- Maintain a clear folder structure and documented interfaces.
- Prefer small, testable modules over giant source files.
- Keep configuration separate from application logic.
- Add tests for every important policy and security decision.
- Do not disable tests or weaken security controls merely to make a build pass.
- Never claim a command or test succeeded unless it was actually executed and verified.
- Avoid unnecessary rewrites and preserve working functionality.
- Never place real credentials or API keys in source control.

## 6. Required product experience

Build a professional, responsive dashboard using a dark navy/black visual theme with restrained cyan/electric-blue accents.

The dashboard should demonstrate:
- Red, Target and Blue domains
- Controlled test requests
- Policy decisions and denial reasons
- Security test outcomes
- Audit events and hash-chain verification
- Target reset when authorized
- Clear errors and documented limitations

## 7. Required deliverables

- Runnable local application
- Backend and domain services
- Policy gateway
- Configured isolation environment
- Browser-based demo interface
- Unit, integration and security tests
- Docker configuration
- GitHub-ready repository
- README with installation and usage instructions
- Architecture and threat-model documentation
- Reproducible demo script
- Evidence distinguishing measured results from proposed metrics

## 8. Development workflow

At the start of a task:
1. Read this file.
2. Inspect relevant source files and documentation.
3. Check current implementation status and test results.
4. Identify dependencies and security implications.
5. Make the smallest complete implementation that satisfies the task.
6. Run relevant tests and inspect failures.
7. Update documentation and implementation status.

For major phases, explain the plan before risky changes. Request approval before destructive operations, public exposure, or actions requiring elevated privileges.

## 9. Honest security claims

TrustX aims to reduce and measure isolation risk. It does not claim perfect isolation.

Container isolation, network segmentation, passing tests, and hash-chain verification each have limitations. Document residual risks and only claim properties that have been demonstrated.

## 10. First task

Inspect the workspace, read the original proposal and event requirements, and produce a requirements-to-implementation checklist. Identify which features are mandatory for a credible Round 2 prototype.

Do not begin a large implementation until the checklist and proposed architecture have been reviewed.