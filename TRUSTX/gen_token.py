import os, jwt
os.environ['TRUSTX_SECRET_KEY'] = 'test-secret-key-for-unit-tests'
from trustx.identity import create_domain_token, Domain

token = create_domain_token(Domain.UI, 'ui-agent')
print('UI token:', token)
decoded = jwt.decode(token, os.environ['TRUSTX_SECRET_KEY'], algorithms=['HS256'])
print('Decoded:', decoded)