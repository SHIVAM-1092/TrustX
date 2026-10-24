#!/usr/bin/env python3
"""
Gateway Health Check Script
Presents client certificate and verifies server certificate against CA.
Used by Docker healthcheck.
"""
import sys
import ssl
import urllib.request
import json

def check_health():
    ca_cert = "/certs/ca.crt"
    client_cert = "/certs/gateway.crt"
    client_key = "/certs/gateway.key"
    url = "https://localhost:8443/health"

    # Create SSL context
    context = ssl.create_default_context(cafile=ca_cert)
    context.load_cert_chain(certfile=client_cert, keyfile=client_key)
    context.check_hostname = False  # Using localhost, not domain name
    context.verify_mode = ssl.CERT_REQUIRED

    try:
        # Create opener with SSL context
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=context))
        response = opener.open(url, timeout=5)

        if response.status == 200:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("status") == "healthy":
                print("Health check OK")
                return 0
            else:
                print(f"Health check failed: unhealthy status: {data}")
                return 1
        else:
            print(f"Health check failed: HTTP {response.status}")
            return 1
    except Exception as e:
        print(f"Health check failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(check_health())