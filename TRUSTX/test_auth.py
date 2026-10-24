"""Test script to verify JWT authentication flow."""
import os
import httpx
import jwt

# Set the same secret as conftest.py
os.environ['TRUSTX_SECRET_KEY'] = 'test-secret-key-for-unit-tests'

from trustx.identity import create_domain_token, Domain

# Create a valid JWT for UI domain
token = create_domain_token(Domain.UI, 'ui-agent')
print('Generated JWT:', token)

# Decode to verify
decoded = jwt.decode(token, os.environ['TRUSTX_SECRET_KEY'], algorithms=['HS256'])
print('Decoded payload:', decoded)

# Test the gateway with this JWT
print('\n--- Testing gateway ---')
with httpx.Client(base_url='https://localhost:8443', timeout=10.0, verify=False) as client:
    # Test 1: Challenges with Bearer JWT
    print('\n1. GET /red/v1/challenges with Bearer JWT:')
    resp = client.get('/red/v1/challenges', headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    print('   Status:', resp.status_code)
    print('   Body:', resp.text[:200])

    # Test 2: Challenges with X-TrustX-Token
    print('\n2. GET /red/v1/challenges with X-TrustX-Token:')
    resp2 = client.get('/red/v1/challenges', headers={'X-TrustX-Token': token, 'Content-Type': 'application/json'})
    print('   Status:', resp2.status_code)
    print('   Body:', resp2.text[:200])