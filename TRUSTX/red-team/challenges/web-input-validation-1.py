"""TrustX Red Team Challenge: Web Input Validation Lab

An intermediate-level lab where learners investigate a local training endpoint
with a controlled injection/input-validation weakness. Demonstrates the intended
impact using harmless seeded data. Keeps all testing inside the isolated lab.
"""

import hashlib
import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel

FLAG_PREFIX = "KALI{"


# Lab workspace configuration
LAB_ROOT = Path("/workspace/challenges/web-input-validation-1")

# Flag secret from environment - unique per deployment
LAB_SECRET = os.getenv("LAB_SECRET", "trustx-lab-secret-dev-only")


class InjectionAttempt(BaseModel):
    """Record an injection attempt."""
    timestamp: float
    injection_type: str
    payload: str
    source_ip: str = "127.0.0.1"
    blocked: bool = False


class ChallengeState(BaseModel):
    """Track learner progress for this challenge."""
    challenge_id: str
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    attempts: List[Dict[str, Any]] = []
    flag: Optional[str] = None
    injection_attempts: List[InjectionAttempt] = []


class ChallengeAttempt(BaseModel):
    """Record of a single challenge attempt."""
    timestamp: float
    payload: str
    target_response: str
    success: bool
    flag_awarded: bool = False


def compute_flag(challenge_id: str, secret: str, subject: str) -> str:
    """Compute a unique flag for a learner completing this challenge."""
    hash_input = f"{challenge_id}:{secret}:{subject}".encode()
    digest = hashlib.sha256(hash_input).hexdigest()[:12]
    return f"{FLAG_PREFIX}{challenge_id}-{digest}}"


# In-memory challenge state store
_challenge_states: Dict[str, ChallengeState] = {}


def init_lab_workspace():
    """Initialize the lab workspace with vulnerable input validation endpoint."""
    LAB_ROOT.mkdir(parents=True, exist_ok=True)

    # Create the vulnerable input validation application
    app_py = LAB_ROOT / "app.py"
    if not app_py.exists():
        app_py.write_text('''\"\"\"TrustX Vulnerable Input Validation Lab - SQL Injection / XSS Training\"\"\"

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import json
import re

app = FastAPI(title="Vulnerable Input Validation App", version="1.0.0")

# Vulnerable data store - no input sanitization
items_db = {
    "1": {"id": "1", "name": "Product Alpha", "description": "A useful widget", "price": 29.99, "owner": "admin"},
    "2": {"id": "2", "name": "Product Beta", "description": "Another widget", "price": 19.99, "owner": "user1"},
    "3": {"id": "3", "name": "Product Gamma", "description": "Gamma widget", "price": 49.99, "owner": "user2"},
}

# Request tracking
request_log = []


class ItemId(BaseModel):
    item_id: str


class SearchQuery(BaseModel):
    query: str


class DeleteRequest(BaseModel):
    item_id: str


@app.get("/")
async def root():
    return {"message": "Welcome to the Vulnerable Input Validation Lab", "status": "vulnerable"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "app": "vulnerable-input-valid",
        "vulnerabilities": ["sql-injection", "xss", "no-input-sanitization"]
    }


@app.get("/items")
async def list_items():
    """List all items - safe endpoint."""
    return {"items": list(items_db.values())}


@app.get("/items/{item_id}")
async def get_item(item_id: str):
    """Get a specific item by ID - VULNERABLE to SQL injection via parameter."""
    # VULNERABILITY: Direct string interpolation into query (no parameterization)
    # In a real app, this would be a SQL query like: SELECT * FROM items WHERE id = ?
    # Here we just do dict lookup but simulate the vulnerability
    item = items_db.get(item_id)

    # Log the request for audit
    request_log.append({
        "timestamp": time.time(),
        "endpoint": f"/items/{item_id}",
        "parameter": item_id
    })

    if item:
        return {"item": item}
    else:
        raise HTTPException(status_code=404, detail="Item not found")


@app.post("/items/search")
async def search_items(query: SearchQuery):
    """Search items by name - VULNERABLE to SQL injection."""
    # VULNERABILITY: Query string directly interpolated into search logic
    # Normally: SELECT * FROM items WHERE name LIKE '%query%'
    # Here: simple substring match but simulates injection vulnerability
    query_str = query.query

    # Log the request
    request_log.append({
        "timestamp": time.time(),
        "endpoint": "/items/search",
        "parameter": query_str
    })

    results = []
    for item_id, item in items_db.items():
        # VULNERABILITY: Naive substring match that doesn't sanitize input
        # This allows injection-style payloads to alter behavior
        if query_str.lower() in str(item).lower():
            results.append({**item, "match_type": "substring"})
        elif "%" in query_str and query_str.replace("%", "") in str(item).lower():
            # Simulate LIKE pattern bypass
            results.append({**item, "match_type": "like-pattern"})

    # Log injection attempts
    if any(keyword in query_str.lower() for keyword in ["drop", "select", "'", "union", "--"]):
        request_log.append({
            "timestamp": time.time(),
            "endpoint": "/items/search",
            "type": "injection_attempt",
            "payload": query_str
        })

    return {"results": results, "query": query_str, "count": len(results)}


@app.post("/items")
async def create_item(item: dict):
    """Create a new item - VULNERABLE to XSS via name field."""
    # VULNERABILITY: No input sanitization - name stored and displayed verbatim
    name = item.get("name", "Unnamed")
    description = item.get("description", "")

    # Store without sanitization - XSS will be demonstrated when viewing
    item_id = str(len(items_db) + 1)
    items_db[item_id] = {
        "id": item_id,
        "name": name,
        "description": description,
        "price": 0.0,
        "owner": "current_user"
    }

    # Log the request
    request_log.append({
        "timestamp": time.time(),
        "endpoint": "/items",
        "type": "create",
        "name": name
    })

    return {"item_id": item_id, "name": name, "status": "created"}


@app.post("/items/{item_id}")
async def update_item(item_id: str, item: dict):
    """Update an item - VULNERABLE to XSS."""
    # VULNERABILITY: No input sanitization on update
    name = item.get("name", "")
    description = item.get("description", "")

    if item_id in items_db:
        items_db[item_id]["name"] = name
        items_db[item_id]["description"] = description

    return {"status": "updated"}


@app.post("/items/{item_id}")
async def delete_item(item_id: ItemId):
    """Delete an item - simulated, doesn't actually delete in prototype."""
    # Simulated delete - in real app would remove from DB
    if item_id in items_db:
        # Mark as deleted rather than actually removing
        items_db[item_id]["deleted"] = True
        return {"status": "deleted", "item_id": item_id}
    raise HTTPException(status_code=404, detail="Item not found")


@app.get("/items/{item_id}/view")
async def view_item(item_id: str):
    """View item - demonstrates XSS when name contains script tags."""
    item = items_db.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # VULNERABILITY: Name displayed without escaping - XSS demonstrated
    html = f'''
    <html>
    <head><title>Item View</title></head>
    <body>
    <h1>Item: {item['name']}</h1>
    <p>Description: {item['description']}</p>
    <p>Price: ${item['price']}</p>
    <p>Owner: {item['owner']}</p>
    </body>
    </html>
    '''

    return {"html": html, "item_id": item_id}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
''')

    # Create the target info file
    info_file = LAB_ROOT / "TARGET_INFO.md"
    if not info_file.exists():
        info_file.write_text(
            "# Web Input Validation Lab\n\n"
            "## Objective\n"
            "Investigate the local training endpoint with a controlled injection or "
            "input-validation weakness. Demonstrate the intended impact using harmless "
            "seeded data. Keep all testing inside the isolated lab.\n\n"
            "## Lab Setup\n"
            "The vulnerable input validation application runs on port 8081 within the "
            "execution environment. You can interact with it via HTTP requests.\n\n"
            "## Known Vulnerabilities\n"
            "1. **SQL Injection via /items/{item_id}**: Parameter not sanitized, "
            "substrings can alter behavior\n"
            "2. **SQL Injection via /items/search**: Search query directly interpolated, "
            "allows injection-style payloads (drop, select, union)\n"
            "3. **XSS via /items POST**: Name field stored and displayed without escaping\n"
            "4. **XSS via /items/{item_id}/view**: Name displayed verbatim in HTML\n\n"
            "## Your Goal\n"
            "1. Test the search endpoint with injection payloads to demonstrate SQL injection\n"
            "2. Test the item creation endpoint with script tags to demonstrate XSS\n"
            "3. View the created item to see the XSS payload executed\n"
            "4. Discover the flag hidden within the application\n\n"
            "## Safe Testing Notes\n"
            "All testing is contained within the lab environment. The injected payloads "
            "only affect the local training application. No data is sent externally. "
            "The SQL injection demonstrations use harmless substring matching - no actual "
            "database queries are executed. The XSS demonstrations use script tags that "
            "only affect the local HTML view.\n\n"
            "## Flag Format: KALI{web-input-validation-1-<hash>}\n"
        )

    # Create hints file
    hints_file = LAB_ROOT / "HINTS.md"
    if not hints_file.exists():
        hints_file.write_text(
            "# Input Validation - Hints\n\n"
            "## Hint 1: Start by listing available items\n"
            "Try the /items endpoint to see what's available.\n\n"
            "## Hint 2: Test the search endpoint\n"
            "Try searching with different queries. Notice how some queries return "
            "unexpected results.\n\n"
            "## Hint 3: Try injection payloads\n"
            "Try search queries with 'drop', 'select', 'union', or single quotes. "
            "The application is vulnerable to injection-style attacks.\n\n"
            "## Hint 4: Create an item with script tags\n"
            "Try creating an item with name '<script>alert('xss')</script>'. Then "
            "view the item to see the XSS demonstrated.\n\n"
            "## Hint 5: View the created item\n"
            "Use the /items/{{id}}/view endpoint to see the HTML output with your "
            "script tag executed.\n\n"
            "## Remediation\n"
            "1. Use parameterized queries / prepared statements for all database interactions\n"
            "2. Implement input validation and sanitization\n"
            "3. Escape all output before rendering in HTML\n"
            "4. Use Content Security Policy (CSP) headers\n"
            "5. Validate input types and lengths strictly"
        )


def get_lab_files() -> List[str]:
    """Get list of files available in the lab workspace."""
    if not LAB_ROOT.exists():
        return []
    return sorted([f.name for f in LAB_ROOT.iterdir() if f.is_file()])


def validate_injection_success(target_response: str, payload: str) -> bool:
    """
    Validate that an injection attempt succeeded by checking the target response.

    The payload contains the injection string, and the target_response contains
    the application's response. Check for success indicators.
    """
    try:
        response_lower = target_response.lower()

        # Check for SQL injection success indicators
        sql_indicators = [
            "error" in response_lower and ("sql" in response_lower or "query" in response_lower),
            "unexpected" in response_lower and "query" in response_lower,
            "results" in response_lower and "items" in response_lower,
        ]

        # Check for XSS success indicators
        xss_indicators = [
            "<script>" in response_lower,
            "alert" in response_lower,
            "javascript:" in response_lower,
        ]

        return any(sql_indicators) or any(xss_indicators)
    except Exception:
        return False


def validate_flag_discovery(command_output: str, subject: str) -> Dict[str, Any]:
    """
    Validate that the learner has discovered the flag through intended investigation.
    """
    # Check if the response contains flag format
    if "KALI{" in command_output and "web-input-validation-1-" in command_output:
        import re
        matches = re.findall(r'KALI\{web-input-validation-1-[a-f0-9]{12}\}', command_output)
        if matches:
            return {
                "success": True,
                "feedback": "Congratulations! You successfully exploited the input validation weakness and discovered the flag.",
                "flag": matches[0]
            }

    # Also check if flag appears in HTML response
    if "KALI{web-input-validation-1-" in command_output:
        import re
        matches = re.findall(r'KALI\{web-input-validation-1-[a-f0-9]{12}\}', command_output)
        if matches:
            return {
                "success": True,
                "feedback": "Congratulations! You successfully exploited the input validation weakness and discovered the flag.",
                "flag": matches[0]
            }

    return {"success": False, "feedback": "Flag not discovered yet. Continue investigating the input validation weaknesses.", "flag": None}


def get_challenge_info() -> Dict[str, Any]:
    """Get challenge metadata for UI."""
    init_lab_workspace()

    return {
        "id": "web-input-validation-1",
        "name": "Web Input Validation",
        "category": "Input Validation / Injection",
        "objective": "Investigate the local training endpoint with controlled injection/input-validation weaknesses. Demonstrate SQL injection and XSS impacts using harmless seeded data, keeping all testing inside the isolated lab.",
        "description": (
            "A local training web application has intentional input validation "
            "weaknesses. Your goal is to:\n"
            "1. Test the search endpoint with injection payloads to demonstrate SQL injection\n"
            "2. Test the item creation endpoint with script tags to demonstrate XSS\n"
            "3. View created items to see the XSS payload executed in HTML\n"
            "4. Discover the flag hidden within the application\n\n"
            "The application has the following known vulnerabilities:\n"
            "- SQL Injection via /items/{item_id}: Parameter not sanitized, "
            "substring matching can alter behavior\n"
            "- SQL Injection via /items/search: Search query directly interpolated, "
            "allows injection-style payloads (drop, select, union)\n"
            "- XSS via /items POST: Name field stored and displayed without escaping\n"
            "- XSS via /items/{item_id}/view: Name displayed verbatim in HTML\n\n"
            "### Safe Testing Approach\n"
            "All testing is contained within the lab environment. The injected payloads "
            "only affect the local training application:\n"
            "- SQL injection demonstrations use harmless substring matching - no actual "
            "database queries are executed\n"
            "- XSS demonstrations use script tags that only affect the local HTML view; "
            "no external data is sent\n"
            "- All data remains within the lab scope\n\n"
            "## Your testing approach:\n"
            "1. Start with `GET /items` to see available items\n"
            "2. Try `GET /items/1` to see parameter behavior\n"
            "3. Try `POST /items/search` with various queries including injection payloads\n"
            "4. Try `POST /items` with name containing `<script>` tags\n"
            "5. Try `GET /items/{{id}}/view` to see XSS in action\n"
            "6. The flag is awarded after demonstrating both injection types and discovering it."
        ),
        "difficulty": "Intermediate",
        "hints": [
            "The search endpoint is vulnerable to injection-style payloads.",
            "Try search queries with 'drop', 'select', 'union', or single quotes.",
            "The item creation endpoint stores names verbatim - try script tags.",
            "View created items via the /view endpoint to see XSS demonstrated.",
            "The flag format is KALI{web-input-validation-1-<hash>}.",
            "You need to demonstrate both SQL injection and XSS to complete the lab."
        ],
        "flag_format": "KALI{web-input-validation-1-<hash>}",
        "target_endpoint": "http://localhost:8081",
        "learning_objectives": [
            "Identify input validation weaknesses in web applications",
            "Demonstrate SQL injection with safe, contained payloads",
            "Demonstrate XSS (cross-site scripting) with contained payloads",
            "Understand the importance of input sanitization and output encoding",
            "Learn remediation techniques for common injection vulnerabilities",
            "Differentiate between SQL injection and XSS impact"
        ]
    }


def validate_attempt(challenge_id: str, payload: str, target_response: str, subject: str) -> Dict[str, Any]:
    """
    Validate a challenge attempt for the Web Input Validation lab.

    The payload contains the HTTP request sent, and the target_response contains
    the application's HTTP response.
    """
    if challenge_id != "web-input-validation-1":
        return {
            "success": False,
            "feedback": f"Unknown challenge: {challenge_id}",
            "flag": None
        }

    # Check if injection/XSS succeeded
    success = validate_injection_success(target_response, payload)

    if success:
        flag = compute_flag(challenge_id, LAB_SECRET, subject)
        return {
            "success": True,
            "feedback": "Success! You exploited the input validation weakness and discovered the flag.",
            "flag": flag
        }

    # Provide hints based on attempt content
    payload_lower = payload.lower()
    if "search" not in payload_lower and "items" not in payload_lower:
        hint = "Hint: Try using the search endpoint with different queries."
    elif "drop" not in payload_lower and "select" not in payload_lower and "union" not in payload_lower:
        hint = "Hint: Try search queries with 'drop', 'select', or 'union' to test SQL injection."
    elif "script" not in payload_lower and "<" not in payload_lower and ">" not in payload_lower:
        hint = "Hint: Try creating an item with a name containing script tags like '<script>alert('xss')</script>'."
    else:
        hint = "Hint: You've injected - try viewing the created item to see XSS, or try different search payloads."

    return {
        "success": False,
        "feedback": "Continue testing the input validation weaknesses." + (f" {hint}" if hint else ""),
        "flag": None
    }


# Pre-initialized lab workspace (called on import)
_lab_initialized = False


def ensure_lab_initialized():
    """Ensure lab workspace is initialized on first access."""
    global _lab_initialized
    if not _lab_initialized:
        init_lab_workspace()
        _lab_initialized = True


# Initialize on import
ensure_lab_initialized()