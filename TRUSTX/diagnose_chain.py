import os, json, hashlib

log_path = 'audit/audit.log'
GENESIS_HASH = '0' * 64

with open(log_path, 'r') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
print(f'File size: {os.path.getsize(log_path)} bytes')

# Verify chain and find first failure
expected_prev = GENESIS_HASH
events_examined = 0
first_failure = None
prev_mismatch_line = None
hash_mismatch_line = None
duplicate_ids = []
seen_ids = set()

for i, line in enumerate(lines, start=1):
    events_examined += 1
    line = line.strip()
    if not line:
        continue
    try:
        event = json.loads(line)
    except Exception as e:
        print(f'Line {i}: Invalid JSON - {e}')
        continue

    # Check for required fields
    required = ['event_id', 'timestamp', 'event_type', 'source_domain', 'destination_domain', 'path', 'method', 'allowed', 'prev_hash', 'hash']
    missing = [f for f in required if f not in event]
    if missing:
        print(f'Line {i}: Missing fields {missing}')

    # Check for duplicate IDs
    eid = event.get('event_id', '')
    if eid in seen_ids:
        duplicate_ids.append((i, eid))
    seen_ids.add(eid)

    recorded_prev = event.get('prev_hash', '')
    recorded_hash = event.get('hash', '')

    # Check prev_hash linkage
    if i == 1:
        prev_match = recorded_prev == GENESIS_HASH
        if not prev_match:
            print(f'Line {i}: First event prev_hash mismatch! Expected genesis, got {recorded_prev[:16]}...')
    else:
        # Get previous event's hash
        prev_event = json.loads(lines[i-2].strip())
        expected_from_prev = prev_event['hash']
        prev_match = recorded_prev == expected_from_prev
        if not prev_match:
            if prev_mismatch_line is None:
                prev_mismatch_line = i
            print(f'Line {i}: prev_hash MISMATCH! expected from line {i-1} hash ({expected_from_prev[:16]}...), got {recorded_prev[:16]}...')

    # Recompute hash
    data_to_hash = {k: v for k, v in event.items() if k != 'hash'}
    canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
    payload = f'{recorded_prev}{canonical_json}'.encode('utf-8')
    computed_hash = hashlib.sha256(payload).hexdigest()

    hash_match = computed_hash == recorded_hash
    if not hash_match:
        if hash_mismatch_line is None:
            hash_mismatch_line = i
        print(f'Line {i}: Hash MISMATCH! Computed {computed_hash[:16]}... Recorded {recorded_hash[:16]}...')
        print(f'  Event ID: {event.get("event_id")}, Type: {event.get("event_type")}, Domains: {event.get("source_domain")} -> {event.get("destination_domain")}')

    # Update expected prev_hash for next iteration
    expected_prev = recorded_hash

    if first_failure is None and (not prev_match or not hash_match):
        first_failure = i

print(f'\n=== SUMMARY ===')
print(f'Events examined: {events_examined}')
print(f'First failure at line: {first_failure}')
print(f'prev_hash mismatch at: {prev_mismatch_line}')
print(f'Hash mismatch at: {hash_mismatch_line}')
print(f'Duplicate IDs: {len(duplicate_ids)}')
if duplicate_ids:
    for line, eid in duplicate_ids[:5]:
        print(f'  Line {line}: duplicate event_id={eid}')