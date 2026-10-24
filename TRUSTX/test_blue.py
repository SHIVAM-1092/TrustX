import sys
sys.path.insert(0, 'blue-team-exec')
from exec_main import app
from fastapi.testclient import TestClient
client = TestClient(app)

resp = client.post('/sessions')
session = resp.json()
session_id = session['session_id']

for cmd in [['ls', '-la'], ['echo', 'hello'], ['cat', 'auth.log']]:
    r = client.post('/execute', json={'command': cmd, 'session_id': session_id})
    out = r.json().get('stdout', '') or ''
    print(f'Command {cmd}: exit={r.json()["exit_code"]}, stdout_starts={out[:80]}, timed_out={r.json()["timed_out"]}')