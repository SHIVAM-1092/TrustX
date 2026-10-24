import json, hashlib

# Event 1 from audit log - WITH prev_hash
event1 = {
    'event_id': 'evt_1792490539314',
    'timestamp': 1792490539.3145895,
    'event_type': 'ACCESS_ALLOWED',
    'source_domain': 'red',
    'destination_domain': 'target',
    'path': '/v1/chat/completions',
    'method': 'POST',
    'allowed': True,
    'client_subject': 'test-agent',
    'status_code': 200,
    'details': {},
    'prev_hash': '0000000000000000000000000000000000000000000000000000000000000000'
}

# compute_hash method from audit.py - includes prev_hash in the payload
prev_hash = '0000000000000000000000000000000000000000000000000000000000000000'
data_to_hash = {k: v for k, v in event1.items() if k != 'hash'}
canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
payload = f'{prev_hash}{canonical_json}'.encode('utf-8')
computed_hash = hashlib.sha256(payload).hexdigest()

print('Event 1 with prev_hash:')
print(f'  Computed hash:  {computed_hash}')
print(f'  Recorded hash:  ce9d5ff9d245c8953ba8be346784ef8580b9f29c01371317d33fd80aa759ea6c')
print(f'  Match: {computed_hash == "ce9d5ff9d245c8953ba8be346784ef8580b9f29c01371317d33fd80aa759ea6c"}')