import sys
sys.path.insert(0, '.')
from gateway.internal.audit import AuditLogger
log_path = 'audit/audit.log'
audit_logger = AuditLogger(log_path)
valid, errors = audit_logger.verify_chain_detailed()
print('Chain valid:', valid)
print('Number of errors:', len(errors))
for err in errors[:5]:
    print('  -', err)