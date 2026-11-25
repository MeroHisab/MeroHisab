"""Quick API smoke test: python smoke_test.py (run from backend/)."""
import uuid
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)
email = f"smoke-{uuid.uuid4().hex[:6]}@x.com"
r = c.post('/auth/register', json={'name': 'a', 'email': email, 'password': 'pw123456'})
print('register', r.status_code)
r = c.post('/auth/login', json={'email': email, 'password': 'pw123456'})
print('login', r.status_code)
h = {'Authorization': 'Bearer ' + r.json()['access_token']}
cu = c.post('/customers/', json={'name': 'Ram'}, headers=h).json()
t = c.post('/transactions/', json={'type': 'CREDIT_SALE', 'amount': 500, 'customer_id': cu['id']}, headers=h)
print('credit', t.status_code, t.json()['status'])
c.patch(f"/transactions/{t.json()['id']}", json={'amount': 300}, headers=h)
print('outstanding (300):', c.get(f"/customers/{cu['id']}", headers=h).json()['outstanding'])
c.post('/transactions/', json={'type': 'REPAYMENT', 'amount': 100, 'customer_id': cu['id']}, headers=h)
print('outstanding (200):', c.get(f"/customers/{cu['id']}", headers=h).json()['outstanding'])
print('delete customer', c.delete(f"/customers/{cu['id']}", headers=h).status_code,
      'tx left', len(c.get('/transactions/', headers=h).json()))
print('form token', c.post('/auth/token', data={'username': email, 'password': 'pw123456'}).status_code)
print('bad token', c.get('/auth/me', headers={'Authorization': 'Bearer x'}).status_code)
