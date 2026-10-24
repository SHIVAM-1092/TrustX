# Project-level conftest.py - sets TrustX test environment variables
# This file runs before test modules are collected, ensuring
# gateway.main imports work correctly without manual env var setting.
#
# Key design points:
# - Safe test-only signing key (not a real secret, not committed to repo)
# - Policy path resolved to gateway/config/policy.yaml relative to PROJECT_ROOT
# - SKIP_TLS_VERIFY=true for local test environment (no mTLS certs in test process)
# - Uses os.environ.setdefault so existing env vars are not overridden
# - Sets TRUSTX_SECRET_KEY to match what gateway/tests/test_gateway.py expects
#
# This file does NOT modify any source files or production behavior.
# It only sets environment variables that the gateway code reads at import time.

import os

# Test signing key - safe test-only key
# The gateway code reads TRUSTX_SECRET_KEY at import time from verifier.py.
# This key must match what the test JWT tokens are signed with.
# Matches the key used by gateway/tests/test_gateway.py and
# tests/integration/test_security_boundary.py and tests/security/test_negative_auth.py.
os.environ.setdefault('TRUSTX_SECRET_KEY', 'test-secret-key-for-unit-tests')

# Policy path - resolved to gateway/config/policy.yaml relative to project root.
# This is the critical fix. The original gateway/config/gateway.yaml had
# policy.path = "/config/policy.yaml" which on Windows does NOT resolve to
# the local gateway/config/policy.yaml. The load_config() resolve_path() function
# treats absolute paths that don't exist on the local filesystem as unresolved,
# leaving the PolicyEngine with zero rules → default-deny on all requests.
# Using a relative path "gateway/config/policy.yaml" is resolved by
# resolve_path() to the actual absolute path under the project root.
# PROJECT_ROOT is 2 levels up from conftest.py (conftest.py -> project root -> parent)
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault('POLICY_PATH', os.path.join(PROJECT_ROOT, 'gateway', 'config', 'policy.yaml'))

# Gateway config path - also resolved absolutely
os.environ.setdefault('GATEWAY_CONFIG', os.path.join(PROJECT_ROOT, 'gateway', 'config', 'gateway.yaml'))

# Skip TLS verification for local test environment.
# The gateway main.py forwards requests upstream using httpx with verify=cfg.tls.ca_cert,
# where cfg.tls.ca_cert points to /certs/ca.crt. In the test environment (no Docker
# containers running), this cert doesn't exist, causing httpx to fail with FileNotFoundError.
# SKIP_TLS_VERIFY=true tells the gateway to skip upstream TLS verification, allowing
# the proxy route to return 502 (upstream error) or the status the test expects,
# rather than crashing on SSL handshake.
os.environ.setdefault('SKIP_TLS_VERIFY', 'true')