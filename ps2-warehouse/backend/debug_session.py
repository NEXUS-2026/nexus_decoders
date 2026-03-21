import traceback, sys
try:
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    resp = client.post('/api/sessions/start', json={
        'operator_id': 'test', 'batch_id': 'lot1', 'input_mode': 'upload',
        'customer_ms': 'ACME', 'challan_no': 'CH-001',
        'products': [{'name': 'ABC', 'qty': 10}]
    })
    print('STATUS:', resp.status_code)
    print('BODY:', resp.text)
except Exception as e:
    traceback.print_exc()
    with open('debug_error.txt', 'w') as f:
        traceback.print_exc(file=f)
    print("Error written to debug_error.txt")
