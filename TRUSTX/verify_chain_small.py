import os, json, hashlib

log_path = 'audit/audit.log'
GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

with open(log_path, 'r') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
print(f'File size: {os.path.getsize(log_path)} bytes')

expected_prev = GENESIS_HASH
errors = []
computed_hashes = []

for i, line in enumerate(lines, start=1):
    line = line.strip()
    if not line:
        continue
    try:
        event = json.loads(line)
    except Exception as e:
        errors.append(f'Line {i}: Invalid JSON - {e}')
        continue

    recorded_prev = event.get('prev_hash', '')
    recorded_hash = event.get('hash', '')

    if recorded_prev != expected_prev:
        errors.append(f'Line {i}: Chain broken! Expected {expected_prev[:10]}... got {recorded_prev[:10]}...')

    data_to_hash = {k: v for k, v in event.items() if k != 'hash'}
    canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
    payload = f'{expected_prev}{canonical_json}'.encode('utf-8')
    computed_hash = hashlib.sha256(payload).hexdigest()
    computed_hashes.append(computed_hash)

    if computed_hash != recorded_hash:
        errors.append(f'Line {i}: Hash mismatch! Computed {computed_hash[:10]}... recorded {recorded_hash[:10]}...')

    expected_prev = recorded_hash

print(f'\nTotal errors: {len(errors)}')
for e in errors[:10]:
    print(f'  {e}')
if len(errors) > 10:
    print(f'  ... and {len(errors)-10} more')