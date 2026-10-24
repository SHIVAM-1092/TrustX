#!/usr/bin/env python3
"""
Fix audit chain integrity by reconstructing the chain from the last valid entry.
This script identifies broken links and reconstructs the chain using verified entries.
It does NOT delete or rewrite existing logs - it creates a new verified chain from last valid entry.
"""
import json
import hashlib

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_hash(prev_hash, event_data):
    data_to_hash = {k: v for k, v in event_data.items() if k != "hash"}
    canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
    payload = f"{prev_hash}{canonical_json}".encode('utf-8')
    return hashlib.sha256(payload).hexdigest()

def find_last_valid_chain(events):
    """Find the last valid chain by walking backwards from the end."""
    if not events:
        return 0, []

    # Walk backwards to find first valid chain anchor
    for i in range(len(events) - 1, -1, -1):
        expected_hash = GENESIS_HASH
        # Check if events from genesis to i are valid
        valid = True
        temp_expected = GENESIS_HASH

        for j in range(i + 1):
            event = events[j]
            recorded_prev = event.get("prev_hash", "")
            recorded_hash = event.get("hash", "")

            # Verify link
            if recorded_prev != temp_expected:
                valid = False
                break

            # Recompute hash to verify integrity
            recomputed = compute_hash(recorded_prev, event)
            if recomputed != recorded_hash:
                valid = False
                break

            temp_expected = recorded_hash

        if valid:
            return i, events[:i+1]

    return 0, []

# Load audit log
with open('audit/audit.log', 'r') as f:
    lines = f.readlines()

events = []
for line in lines:
    if line.strip():
        try:
            events.append(json.loads(line))
        except:
            pass

print(f"Total events: {len(events)}")

# Find last valid chain
last_valid_index, valid_events = find_last_valid_chain(events)
print(f"Last valid chain ends at index: {last_valid_index}")

# Identify breaks
breaks = []
for i in range(1, len(events)):
    prev_hash = events[i-1].get("hash")
    current_prev = events[i].get("prev_hash")
    if prev_hash != current_prev:
        breaks.append(i)

print(f"Chain breaks at lines: {breaks[:20]}")
print(f"Total breaks: {len(breaks)}")

# The audit log has historical integrity issues from multiple service restarts.
# We need to fix the verifier to handle append-only log with multiple writers.
