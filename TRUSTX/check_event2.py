import json, hashlib

# Event 2 from audit log
event2 = {
    'event_id': 'evt_1792490539348',
    'timestamp': 1792490539.3489127,
    'event_type': 'ACCESS_DENIED',
    'source_domain': 'red',
    'destination_domain': 'blue',
    'path': '/health',
    'method': 'GET',
    'allowed': False,
    'client_subject': 'test-agent',
    'status_code': None,
    'details': {'reason': 'Policy violation', 'rule': 'default-deny'},
    'prev_hash': 'ce9d5ff9d245c8953ba8be346784ef8580b9f29c01371317d33fd80aa759ea6c'
}

prev_hash = 'ce9d5ff9d245c8953ba8be346784ef8580b9f29c01371317d33fd80aa759ea6c'
data_to_hash = {k: v for k, v in event2.items() if k != 'hash'}
canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
payload = f'{prev_hash}{canonical_json}'.encode('utf-8')
computed_hash = hashlib.sha256(payload).hexdigest()

print('Event 2:')
print(f'  Computed hash:  {computed_hash}')
print(f'  Recorded hash:  0a7c39f95ddff7eac2471d5419a459a5ffd576c4ffbcd995a1115c2acc830f9b')
print(f'  Match: {computed_hash == "0a7c39f95ddff7eac2471d5419a459a5ffd576c4ffbcd995a1115c2acc830f9b"}')