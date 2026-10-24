#!/usr/bin/env python3
"""Check Uvicorn SSL options"""
import sys
sys.path.insert(0, '.venv/Lib/site-packages')

from uvicorn.config import Config
import inspect

sig = inspect.signature(Config)
print('Config parameters:')
for name, param in sig.parameters.items():
    if 'ssl' in name.lower():
        print(f'  {name}: kind={param.kind.name}, default={param.default}')

# Also check what the actual valid options are
print('\nChecking ssl-certfile, ssl-keyfile, ssl-ca-certs, ssl-cert-reqs...')