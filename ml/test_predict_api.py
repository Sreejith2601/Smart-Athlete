import urllib.request
import json
import urllib.error

url = "http://localhost:5001/predict"
payload = {
    "cpi": 64.76,
    "loadScore": 73.7,
    "performanceScore": 91.95,
    "efficiencyScore": 70.2,
    "trend": "improving",
    "compliance": 88.6,
    "weeklySessions": 6,
    "avgDuration": 3443.1,
    "fatigueIndex": 21.96,
    "stressScore": 442.19,
    "recoveryScore": 158.8
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as response:
        res_data = response.read().decode("utf-8")
        print(f"Status Code: {response.status}")
        print(f"Response Body: {res_data}")
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
