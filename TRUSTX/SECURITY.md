# Security Policy

## Scope

TrustX is a local prototype for authorized AI-security testing. It is not currently represented as production-ready software.

## Safe use

- Run the services locally in an isolated environment.
- Use synthetic data and local-only secrets.
- Do not expose the demo services directly to the public internet.
- Do not test third-party systems without explicit authorization.
- Do not commit `.env` files, private keys, tokens, or real user data.

## Reporting a vulnerability

For a class or hackathon project, privately contact the repository maintainers/team before publishing exploit details. Include the affected component, reproduction steps, impact, and a minimal proof of concept that does not expose real data.

## Security claims

A configured control is not automatically a verified control. Consult `docs/KNOWN_LIMITATIONS.md` and `docs/TESTING.md` before relying on any claim about authentication, mTLS, isolation, or audit integrity.
