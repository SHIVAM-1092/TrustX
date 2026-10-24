#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')
from gateway.internal.audit import AuditLogger
import os

log_path = 'audit/audit.log'
audit_logger = AuditLogger(log_path)

valid, errors = audit_logger.verify_chain_detailed()
print(f'Chain valid: {valid}')
if errors:
    print(f'Number of errors: {len(errors)}')
    for err in errors[:10]:
        print(f'  - {err}')
else:
    print('No errors found')