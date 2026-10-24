#!/usr/bin/env python3
import subprocess
import json

# Test 1: Verify all Docker services are running
print("=== TEST 1: Docker Services Status ===")
result = subprocess.run(
    ['docker', 'ps', '--filter', 'name=trustx', '--format', "{{.Names}} {{.Status}}"],
    capture_output=True, text=True, timeout=10
)
print(result.stdout)
print()

# Test 2: Check gateway health
print("=== TEST 2: Gateway Health ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '5', 'http://localhost:8443/health'],
    capture_output=True, text=True, timeout=10
)
print("Gateway health:", result.stdout.strip())
print()

# Test 3: Check red-team-exec health
print("=== TEST 3: Red Team Exec Health ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '5', 'http://localhost:8081/health'],
    capture_output=True, text=True, timeout=10
)
print("Red exec health:", result.stdout.strip())
print()

# Test 4: Check blue-team-exec health
print("=== TEST 4: Blue Team Exec Health ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '5', 'http://localhost:8082/health'],
    capture_output=True, text=True, timeout=10
)
print("Blue exec health:", result.stdout.strip())
print()

# Test 5: Create Red Team session
print("=== TEST 5: Create Red Team Session ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '5', '-X', 'POST', 'http://localhost:8081/sessions'],
    capture_output=True, text=True, timeout=10
)
print("Create session:", result.stdout.strip())
print()

# Test 6: Execute simple command in Red Team
print("=== TEST 6: Execute 'echo hello' in Red Team ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '10', '-X', 'POST', 'http://localhost:8081/execute',
     '-H', 'Content-Type: application/json',
     '-d', '{"command":["echo","hello"],"session_id":"f5b6964a-b79","timeout":5,"max_output":100}'],
    capture_output=True, text=True, timeout=15
)
print("Execute hello:", result.stdout.strip())
print()

# Test 7: Try blocked command (rm)
print("=== TEST 7: Execute 'rm -rf /workspace' in Red Team (sandbox test) ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '10', '-X', 'POST', 'http://localhost:8081/execute',
     '-H', 'Content-Type: application/json',
     '-d', '{"command":["rm","-rf","/workspace"],"session_id":"f5b6964a-b79","timeout":5,"max_output":100}'],
    capture_output=True, text=True, timeout=15
)
print("Execute rm:", result.stdout.strip())
print()

# Test 8: Blue Team session creation
print("=== TEST 8: Create Blue Team Session ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '5', '-X', 'POST', 'http://localhost:8082/sessions'],
    capture_output=True, text=True, timeout=10
)
print("Create blue session:", result.stdout.strip())
print()

# Test 9: Blue Team execute
print("=== TEST 9: Execute 'echo world' in Blue Team ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '10', '-X', 'POST', 'http://localhost:8082/execute',
     '-H', 'Content-Type: application/json',
     '-d', '{"command":["echo","world"],"session_id":"new","timeout":5,"max_output":100}'],
    capture_output=True, text=True, timeout=15
)
print("Execute world:", result.stdout.strip())
print()

# Test 10: Blue Team analyze
print("=== TEST 10: Blue Team Analyze ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '10', '-X', 'POST', 'http://localhost:8082/analyze',
     '-H', 'Content-Type: application/json',
     '-d', '{"log_path":"/workspace/sessions/f5b6964a-b79/auth.log","search_terms":["Failed","sudo"]}'],
    capture_output=True, text=True, timeout=15
)
print("Analyze:", result.stdout.strip())
print()

# Test 11: Blue Team detect
print("=== TEST 11: Blue Team Detect ===")
result = subprocess.run(
    ['curl', '-s', '--max-time', '10', '-X', 'POST', 'http://localhost:8082/detect',
     '-H', 'Content-Type: application/json',
     '-d', '{"log_path":"/workspace/sessions/f5b6964a-b79/auth.log","session_id":"f5b6964a-b79"}'],
    capture_output=True, text=True, timeout=15
)
print("Detect:", result.stdout.strip())
print()

print("=== ALL RUNTIME TESTS COMPLETE ===")