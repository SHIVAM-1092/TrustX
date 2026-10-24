"""TrustX Challenge Base Classes

Shared base classes and utilities for all challenges.
No imports from the challenges subpackage to avoid circular imports.
"""

import hashlib
import os
import time
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


# Flag configuration
FLAG_PREFIX = "KALI{"


def compute_flag(challenge_id: str, secret: str, subject: str) -> str:
    """Compute a unique flag for a learner completing this challenge."""
    hash_input = f"{challenge_id}:{secret}:{subject}".encode()
    digest = hashlib.sha256(hash_input).hexdigest()[:12]
    return f"{FLAG_PREFIX}{challenge_id}-{digest}}}"


# In-memory challenge state store (prototype - would use DB in production)
_challenge_states: Dict[str, Any] = {}


def get_challenge_state(challenge_id: str, subject: str) -> Any:
    """Get or create challenge state for a learner."""
    key = f"{challenge_id}:{subject}"
    if key not in _challenge_states:
        from pydantic import BaseModel as _BM
        _challenge_states[key] = {"challenge_id": challenge_id}
    return _challenge_states[key]


def record_attempt(
    challenge_id: str,
    subject: str,
    payload: Any,
    result: Any,
    success: bool,
    flag: Optional[str] = None
) -> Dict[str, Any]:
    """Record an attempt and return validation result."""
    state = get_challenge_state(challenge_id, subject)

    if state.started_at is None:
        state.started_at = time.time()

    attempt = {
        "timestamp": time.time(),
        "payload": payload,
        "result": result,
        "success": success,
        "flag_awarded": flag is not None
    }
    state.setdefault("attempts", []).append(attempt)

    if success and state.get("completed_at") is None:
        state["completed_at"] = time.time()
        state["flag"] = flag

    return {
        "challenge_id": challenge_id,
        "success": success,
        "feedback": "",
        "flag": flag,
        "attempt_number": len(state.get("attempts", [])),
        "completed": state.get("completed_at") is not None
    }


def reset_challenge(challenge_id: str, subject: str) -> Dict[str, str]:
    """Reset challenge state for replay."""
    key = f"{challenge_id}:{subject}"
    if key in _challenge_states:
        del _challenge_states[key]
    return {"status": "reset", "challenge_id": challenge_id}


class ChallengeRegistry:
    """Registry for all challenges."""

    def __init__(self):
        self._challenges: Dict[str, Dict[str, Any]] = {}

    def register(self, challenge_id: str, challenge_info: Dict[str, Any],
                 validate_func=None) -> None:
        """Register a challenge with its ID, info dict, and optional validator."""
        self._challenges[challenge_id] = {
            "id": challenge_id,
            "info": challenge_info,
            "validate": validate_func
        }

    def get(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Get a challenge by ID."""
        return self._challenges.get(challenge_id)

    def list_all(self) -> List[Dict[str, Any]]:
        """List all registered challenges."""
        return list(self._challenges.values())

    def list_by_team(self, team: str) -> List[Dict[str, Any]]:
        """List challenges by team."""
        return [c for c in self._challenges.values() if c["info"].get("team") == team]

    def list_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """List challenges by difficulty."""
        return [c for c in self._challenges.values() if c["info"].get("difficulty") == difficulty]

    def get_stats(self) -> Dict[str, int]:
        """Get challenge statistics."""
        stats = {"total": len(self._challenges), "red": 0, "blue": 0}
        for c in self._challenges.values():
            if c["info"].get("team") == "red":
                stats["red"] += 1
            elif c["info"].get("team") == "blue":
                stats["blue"] += 1
        return stats


# Global registry instance
registry = ChallengeRegistry()