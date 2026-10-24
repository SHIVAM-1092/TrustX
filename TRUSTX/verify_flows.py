import os
from dotenv import load_dotenv
load_dotenv('.env')
print('Live .env secret (first 10 chars):', os.getenv('TRUSTX_SECRET_KEY', 'NOT SET')[:10] + '...')
from trustx.identity import create_domain_token, Domain
t = create_domain_token(Domain.RED, 'test-agent')
import jwt
payload = jwt.decode(t, os.getenv('TRUSTX_SECRET_KEY'), algorithms=['HS256'])
print('Token verified with live secret, domain:', payload['domain'])
from fastapi.testclient import TestClient
from gateway.main import app
client = TestClient(app)
resp = client.post('/target/v1/chat/completions', headers={'Authorization': f'Bearer {t}'}, json={'messages':[{'role':'user','content':'Hello'}]})
print('Red->Target status:', resp.status_code)
resp = client.get('/blue/health', headers={'Authorization': f'Bearer {t}'})
print('Red->Blue status:', resp.status_code)