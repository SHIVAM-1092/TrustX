import subprocess
result = subprocess.run(
    ['python3', '-c',
     'import requests; r=requests.post("http://localhost:8081/sessions",json={},timeout=5); print("Session:",r.json()[0])'],
    capture_output=True, text=True, timeout=30
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RC:", result.returncode)