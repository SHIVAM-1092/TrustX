#!/usr/bin/env python3
import json
import hashlib

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_hash(prev_hash, event_data):
    data_to_hash = {k: v for k, v in event_data.items() if k != "hash"}
    canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
    payload = f"{prev_hash}{canonical_json}".encode('utf-8')
    return hashlib.sha256(payload).hexdigest()

# Load audit log
with open('audit/audit.log', 'r') as f:
    lines = f.readlines()

events = []
for i, line in enumerate(lines):
    if line.strip():
        try:
            events.append(json.loads(line))
        except:
            pass

print(f"Total parseable events: {len(events)}")

# Verify from genesis
expected = GENESIS_HASH
broken_at = []
for i, event in enumerate(events):
    recorded_prev = event.get("prev_hash", "")
    recorded_hash = event.get("hash", "")

    if recorded_prev != expected:
        broken_at.append((i+1, f"prev mismatch: expected {expected[:16]}..., got {recorded_prev[:16]}..."))

    computed = compute_hash(recorded_prev, event)
    if computed != recorded_hash:
        broken_at.append((i+1, f"hash mismatch at {i+1}: computed {computed[:16]}..., recorded {recorded_hash[:16]}..."))

    expected = recorded_hash

print(f"Total breaks: {len(broken_at)}")
print(f"\nFirst 10 breaks:")
for idx, msg in broken_at[:10]:
    print(f"  Line {idx}: {msg}")

print(f"\nLines 68-75 events:")
for i in range(67, min(75, len(events))):
    e = events[i]
    print(f"  Line {i+1}: event_id={e.get('event_id')}, source={e.get('source_domain')}, dest={e.get('destination_domain')}, prev={e.get('prev_hash')[:16]}..., hash={e.get('hash')[:16]}...")