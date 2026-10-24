import json
import hashlib

def compute_hash(prev_hash, event_data):
    data_to_hash = {k: v for k, v in event_data.items() if k != "hash"}
    canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
    payload = f"{prev_hash}{canonical_json}".encode('utf-8')
    return hashlib.sha256(payload).hexdigest()

def verify_log(log_path):
    with open(log_path, 'r') as f:
        lines = f.readlines()

    events = [json.loads(line.strip()) for line in lines if line.strip()]

    expected_prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    for i, event in enumerate(events):
        recorded_prev_hash = event.get("prev_hash")
        computed_hash = compute_hash(recorded_prev_hash, event)

        if recorded_prev_hash != expected_prev_hash:
            print(f"Mismatch at line {i+1}: expected prev_hash {expected_prev_hash}, got {recorded_prev_hash}")

        expected_prev_hash = event.get("hash")

verify_log('audit/audit.log')