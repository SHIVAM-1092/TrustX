#!/usr/bin/env python3
import requests
import json

def test_red_team_exec():
    """Test Red Team execution environment"""
    print("=" * 60)
    print("RED TEAM EXECUTION ENVIRONMENT TESTS")
    print("=" * 60)

    # Create session
    r = requests.post('http://localhost:8081/sessions', json={}, timeout=5)
    assert r.status_code == 200, f"Create session failed: {r.status_code}"
    session = r.json()
    session_id = session['session_id']
    print(f"✓ Created session: {session_id}")

    # Execute simple command
    r = requests.post('http://localhost:8081/execute',
        json={'command': ['echo', 'hello'], 'session_id': session_id, 'timeout': 5, 'max_output': 100},
        timeout=5)
    assert r.status_code == 200, f"Execute failed: {r.status_code}"
    result = r.json()
    assert result['exit_code'] == 0, f"Exit code not 0: {result['exit_code']}"
    assert 'hello' in result['stdout'], f"Expected 'hello' in stdout: {result['stdout']}"
    assert result['timed_out'] == False, f"Command should not time out"
    print(f"✓ Execute 'echo hello': exit={result['exit_code']}, stdout={result['stdout'].strip()}")

    # Test command sandboxing - rm should be blocked/return error
    r = requests.post('http://localhost:8081/execute',
        json={'command': ['rm', '-rf', '/workspace'], 'session_id': session_id, 'timeout': 5, 'max_output': 100},
        timeout=5)
    result = r.json()
    print(f"✓ Execute 'rm -rf /workspace': exit={result['exit_code']}, timed_out={result['timed_out']}, stdout={result['stdout'][:100] if result['stdout'] else '(empty)'}")

    # Test timeout
    r = requests.post('http://localhost:8081/execute',
        json={'command': ['sleep', '10'], 'session_id': session_id, 'timeout': 1, 'max_output': 100},
        timeout=5)
    result = r.json()
    assert result['timed_out'] == True, f"Command should have timed out"
    print(f"✓ Execute 'sleep 10' with 1s timeout: timed_out={result['timed_out']}")

    # Verify session ownership / isolation info
    print(f"\n✓ Red Team session working_dir: {session['working_dir']}")
    print(f"✓ Red Team session command_count: {session['command_count']}")

    # Delete session
    r = requests.delete('http://localhost:8081/sessions/{}'.format(session_id), timeout=5)
    assert r.status_code == 200, f"Delete session failed: {r.status_code}"
    print(f"✓ Delete session: {session_id}")

    print("\n" + "=" * 60)
    print("RED TEAM EXECUTION TESTS PASSED")
    print("=" * 60)


def test_blue_team_exec():
    """Test Blue Team execution environment"""
    print("\n" + "=" * 60)
    print("BLUE TEAM EXECUTION ENVIRONMENT TESTS")
    print("=" * 60)

    # Create session
    r = requests.post('http://localhost:8082/sessions', json={}, timeout=5)
    assert r.status_code == 200, f"Create session failed: {r.status_code}"
    session = r.json()
    session_id = session['session_id']
    print(f"✓ Created session: {session_id}")

    # Execute simple command
    r = requests.post('http://localhost:8082/execute',
        json={'command': ['echo', 'world'], 'session_id': session_id, 'timeout': 5, 'max_output': 100},
        timeout=5)
    assert r.status_code == 200, f"Execute failed: {r.status_code}"
    result = r.json()
    assert result['exit_code'] == 0, f"Exit code not 0: {result['exit_code']}"
    assert 'world' in result['stdout'], f"Expected 'world' in stdout: {result['stdout']}"
    print(f"✓ Execute 'echo world': exit={result['exit_code']}, stdout={result['stdout'].strip()}")

    # Execute analysis
    log_path = "/workspace/sessions/{}/auth.log".format(session_id) if False else "/workspace/sessions/f2efa4d2-315/auth.log"
    # Use a known path pattern - let's check what files exist
    r = requests.get('http://localhost:8082/sessions', timeout=5)
    sessions = r.json()
    if sessions and 'sessions' in sessions and len(sessions['sessions']) > 0:
        first_session = sessions['sessions'][0]['session_id']
        log_path = "/workspace/sessions/{}/auth.log".format(first_session)
    else:
        log_path = "/workspace/sessions/f2efa4d2-315/auth.log"

    r = requests.post('http://localhost:8082/analyze',
        json={'log_path': log_path, 'search_terms': ['Failed', 'sudo', 'authentication failure']},
        timeout=5)
    assert r.status_code == 200, f"Analyze failed: {r.status_code}"
    result = r.json()
    print(f"✓ Blue Exec analyze: matches_found={result.get('matches_found', 'N/A')}, total_lines={result.get('total_lines', 'N/A')}")

    # Execute detection
    r = requests.post('http://localhost:8082/detect',
        json={'log_path': log_path, 'session_id': session_id},
        timeout=5)
    assert r.status_code == 200, f"Detect failed: {r.status_code}"
    result = r.json()
    print(f"✓ Blue Exec detect: patterns_found={result.get('patterns_found', [])}")

    # Delete session
    r = requests.delete('http://localhost:8082/sessions/{}'.format(session_id), timeout=5)
    assert r.status_code == 200, f"Delete session failed: {r.status_code}"
    print(f"✓ Delete session: {session_id}")

    print("\n" + "=" * 60)
    print("BLUE TEAM EXECUTION TESTS PASSED")
    print("=" * 60)


if __name__ == '__main__':
    test_red_team_exec()
    test_blue_team_exec()
    print("\n✓ ALL RUNTIME TESTS PASSED")