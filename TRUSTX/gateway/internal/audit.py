"""Tamper-Evident Hash-Chained Audit Logger for TrustX

Logs every cross-domain access request, decision, and system event.
Maintains a SHA-256 hash chain where:
  hash_i = SHA256(hash_{i-1} || event_json_i)

Limitations (documented explicitly):
- This is a local hash chain, NOT an immutable distributed ledger.
- A local attacker with filesystem root access can rewrite history and recompute hashes.
- For true immutability, logs must be shipped in real-time to write-once storage (WORM) or append-only cloud logs (AWS CloudTrail, GCP Audit Logs).
"""

import os
import json
import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field


class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{int(time.time()*1000)}")
    timestamp: float = Field(default_factory=time.time)
    event_type: str  # ACCESS_ALLOWED, ACCESS_DENIED, UPSTREAM_ERROR, POLICY_RELOAD
    source_domain: str
    destination_domain: str
    path: str
    method: str
    allowed: bool
    client_subject: str = "unknown"
    status_code: Optional[int] = None
    details: Dict[str, Any] = {}
    prev_hash: str = ""
    hash: str = ""


class AuditLogger:
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self, log_path: str, state_path: Optional[str] = None):
        self.log_path = log_path
        # Use separate state file to prevent chain breaks from concurrent/parallel writes
        if state_path:
            self.state_path = state_path
        else:
            self.state_path = log_path + ".state"
        self._ensure_log_file()
        self.last_hash = self._get_last_hash_from_state()

    def _ensure_log_file(self):
        log_dir = os.path.dirname(self.log_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        if not os.path.exists(self.log_path):
            with open(self.log_path, 'w') as f:
                pass  # create empty file

    def _get_last_hash_from_file(self) -> str:
        """Reads the last line of the audit file to extract the previous hash."""
        if not os.path.exists(self.log_path) or os.path.getsize(self.log_path) == 0:
            return self.GENESIS_HASH

        try:
            with open(self.log_path, 'r') as f:
                lines = f.readlines()
                if lines:
                    last_line = lines[-1].strip()
                    if last_line:
                        data = json.loads(last_line)
                        return data.get("hash", self.GENESIS_HASH)
        except Exception:
            pass
        return self.GENESIS_HASH

    def _get_last_hash_from_state(self) -> str:
        """Reads the last known good hash from the separate state file."""
        if not os.path.exists(self.state_path) or os.path.getsize(self.state_path) == 0:
            return self._get_last_hash_from_file()

        try:
            with open(self.state_path, 'r') as f:
                data = json.load(f)
                return data.get("last_hash", self._get_last_hash_from_file())
        except Exception:
            return self._get_last_hash_from_file()

    def _save_last_hash_to_state(self, last_hash: str):
        """Saves the last known good hash to the separate state file."""
        try:
            with open(self.state_path, 'w') as f:
                json.dump({"last_hash": last_hash}, f)
        except Exception:
            pass  # State file failure is non-fatal; logger falls back to file reading

    def compute_hash(self, prev_hash: str, event_data: dict) -> str:
        """Computes SHA-256(prev_hash || canonical_json(event_data_without_hash))"""
        # Exclude hash itself from hash computation
        data_to_hash = {k: v for k, v in event_data.items() if k != "hash"}
        canonical_json = json.dumps(data_to_hash, sort_keys=True, separators=(',', ':'))
        payload = f"{prev_hash}{canonical_json}".encode('utf-8')
        return hashlib.sha256(payload).hexdigest()

    def log_event(self, event: AuditEvent) -> AuditEvent:
        """Appends a new event to the hash chain."""
        # Try state file first, fall back to file reading
        expected_prev_hash = self._get_last_hash_from_state()

        event.prev_hash = expected_prev_hash
        event_dict = event.model_dump()
        event.hash = self.compute_hash(expected_prev_hash, event_dict)
        event_dict["hash"] = event.hash

        # Write to append-only JSONL file
        with open(self.log_path, 'a') as f:
            f.write(json.dumps(event_dict) + "\n")

        self.last_hash = event.hash
        # Save to state file for future reference
        self._save_last_hash_to_state(event.hash)
        return event

    def log_denied_access(self, source: str, destination: str, path: str, reason: str):
        self.log_event(AuditEvent(
            event_type="ACCESS_DENIED",
            source_domain=source if isinstance(source, str) else source.value,
            destination_domain=destination if isinstance(destination, str) else destination.value,
            path=path,
            method="UNKNOWN",
            allowed=False,
            details={"reason": reason}
        ))

    def read_events(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Reads stored audit events."""
        if not os.path.exists(self.log_path):
            return []

        events = []
        with open(self.log_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        events.append(json.loads(line))
                    except Exception:
                        pass

        # Return sliced
        return events[offset:offset+limit]

    def verify_chain_integrity(self) -> bool:
        """Verifies full audit log hash chain. Returns True if valid."""
        valid, _ = self.verify_chain_detailed()
        return valid

    def verify_chain_detailed(self) -> Tuple[bool, List[str]]:
        """
        Verifies full hash chain line-by-line.
        Returns (is_valid, list_of_error_strings).
        """
        # Use state file to determine starting point
        # The original log may have historical integrity issues from multiple restarts
        # We verify from the beginning and report all breaks honestly
        if not os.path.exists(self.log_path) or os.path.getsize(self.log_path) == 0:
            return True, []

        errors = []
        expected_prev_hash = self.GENESIS_HASH

        with open(self.log_path, 'r') as f:
            for line_no, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue

                try:
                    event = json.loads(line)
                except Exception as e:
                    errors.append(f"Line {line_no}: Invalid JSON - {e}")
                    continue

                recorded_prev_hash = event.get("prev_hash", "")
                recorded_hash = event.get("hash", "")

                # 1. Verify link to previous hash
                if recorded_prev_hash != expected_prev_hash:
                    errors.append(
                        f"Line {line_no}: Chain broken! Expected prev_hash {expected_prev_hash[:10]}..., got {recorded_prev_hash[:10]}..."
                    )

                # 2. Recompute hash and check match
                computed_hash = self.compute_hash(recorded_prev_hash, event)
                if computed_hash != recorded_hash:
                    errors.append(
                        f"Line {line_no}: Hash mismatch! Computed {computed_hash[:10]}..., recorded {recorded_hash[:10]}... (Tampering detected)"
                    )

                expected_prev_hash = recorded_hash

        return len(errors) == 0, errors

    def flush(self):
        pass  # File operations are synchronous in Python open('a')