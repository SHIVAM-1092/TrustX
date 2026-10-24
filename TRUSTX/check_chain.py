import json, hashlib

with open('audit/audit.log') as f:
    lines = f.readlines()

GENESIS = '0'*64
expected = GENESIS
breaks = []
for i, line in enumerate(lines, 1):
    line = line.strip()
    if not line: continue
    try:
        e = json.loads(line)
    except:
        continue
    # Check prev_hash link
    if i > 1 and e['prev_hash'] != expected:
        breaks.append(f'Line {i}: prev_hash mismatch (expected {expected[:16]}..., got {e["prev_hash"][:16]}...)')
    # Check hash computation
    data_to_hash = {k:v for k,v in e.items() if k != 'hash'}
    canonical = json.dumps(data_to_hash, sort_keys=True, separators=(',',':'))
    computed = hashlib.sha256(f'{expected}{canonical}'.encode()).hexdigest()
    if computed != e['hash']:
        breaks.append(f'Line {i}: hash mismatch')
    expected = e['hash']

print(f'Chain breaks: {len(breaks)}')
for b in breaks[:5]:
    print(f'  {b}')
print(f'Last event hash: {expected[:16]}...')