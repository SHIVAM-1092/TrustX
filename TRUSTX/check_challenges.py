#!/usr/bin/env python3
import requests
import json

# Try HTTP first
try:
    r = requests.get('http://localhost:8443/red/v1/challenges', timeout=5, verify=False)
    print(f"HTTP Status: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"HTTP failed: {e}")

# Try with the gateway via its internal port
try:
    r = requests.get('http://host.docker.internal:8443/red/v1/challenges', timeout=5, verify=False)
    print(f"Host internal HTTP Status: {r.status_code}")
    print(f"Host internal Response: {r.text[:500]}")
except Exception as e:
    print(f"Host internal HTTP failed: {e}")

# Try via the UI proxy
try:
    r = requests.get('http://localhost:5173/api/red/v1/challenges', timeout=5, verify=False)
    print(f"UI proxy HTTP Status: {r.status_code}")
    print(f"UI proxy Response: {r.text[:500]}")
except Exception as e:
    print(f"UI proxy HTTP failed: {e}")