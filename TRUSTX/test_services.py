#!/usr/bin/env python3
import urllib.request, ssl, json, os, sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

services = [
    ("UI", "http://localhost:5173"),
    ("Red-Exec", "http://localhost:8081/health"),
    ("Red-Team", "http://localhost:8001/health"),
    ("Target", "http://localhost:8002/health"),
    ("Blue-Team", "http://localhost:8003/health"),
    ("Gateway (skip TLS verify)", "https://localhost:8443/health"),
]

print(f"{\"Service\":<35} {\"Status\":>8} {\"Response\":>60}")
print("-" * 105)

for name, url in services:
    try:
        r = urllib.request.urlopen(url, timeout=5, context=ctx)
        body = r.read().decode()[:80].replace("\n", " ")
        print(f"{name:<35} {r.status:>8} {body:>60}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:80].replace("\n", " ")
        print(f"{name:<35} {e.code:>8} {body:>60}")
    except Exception as e:
        print(f"{name:<35} {'error':>8} {str(e):>60}")