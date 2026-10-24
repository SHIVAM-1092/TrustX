"""TrustX Tamper-Evident SHA-256 Hash-Chained Audit Logger

Records every authorization check, allow/deny outcome, and system event.
Maintains a cryptographic hash chain:
  H_i = SHA-256( H_{i-1} || canonical_json(event_data_i) )

Explicitly Documented Limitations (CLAUDE.md §4, §9):
- A hash chain detects changes relative to a trusted chain state or previously anchored hash.
- It does NOT independently prevent a compromised local root user from truncating or completely rewriting the log file and regenerating matching hashes.
- True append-only immutability requires external WORM storage or remote log attestation.
"""

import os
import json
import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditRecord(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt-{int(time.time()*1000)}-{os.urandom(4).hex()}")
    timestamp: float = Field(default_factory=time.time)
    event_type: str  # ACCESS_ALLOWED, ACCESS_DENIED, AUTHENTICATION_FAILED, TARGET_RESET, AUDIT_VERIFIED
    source_domain: str
    destination_domain: str
    path: str
    method: str
    allowed: bool
    subject: str = "unknown"
    status_code: Optional[int] = None
    reason: str = ""
    details: Dict[str, Any] = Field(default_factory=dict)
    prev_hash: str = ""
    hash: str = ""

class ChainVerificationResult(BaseModel):
    valid: bool
    total_records: int
    verified_records: int
    genesis_hash: str
    latest_hash: str
    errors: List[str] = Field(default_factory=list)
    limitations: str = (
        "Hash chain verifies linear sequence integrity and detects modifications relative to prior hashes. "
        "It does not prevent complete log truncation or rewriting by a host with local write access."
    )

class AuditChain:
    def __init__(self, log_path: str):
        self.log_path = log_path
        self._ensure_file()
        self.last_hash = self._get_last_hash()

    def _ensure_file(self):
        log_dir = os.path.dirname(self.log_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        if not os.path.exists(self.log_path):
            with open(self.log_path, 'w', encoding='utf-8') as f:
                pass

    def _get_last_hash(self) -> str:
        if not os.path.exists(self.log_path) or os.path.getsize(self.log_path) == 0:
            return GENESIS_HASH

        try:
            with open(self.log_path, 'r', encoding='utf-8') as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]
                if lines:
                    last_obj = json.loads(lines[-1])
                    return last_obj.get("hash", GENESIS_HASH)
        except Exception:
            pass
        return GENESIS_HASH

    @staticmethod
    def compute_record_hash(prev_hash: str, record_dict: Dict[str, Any]) -> str:
        """Computes SHA-256(prev_hash || canonical_json(record_without_hash))"""
        to_hash = {k: v for k, v in record_dict.items() if k != "hash"}
        canonical_json = json.dumps(to_hash, sort_keys=True, separators=(',', ':'))
        payload = f"{prev_hash}:{canonical_json}".encode('utf-8')
        return hashlib.sha256(payload).hexdigest()

    def append(
        self,
        event_type: str,
        source: str,
        destination: str,
        path: str,
        method: str,
        allowed: bool,
        subject: str = "unknown",
        status_code: Optional[int] = None,
        reason: str = "",
        details: Optional[Dict[str, Any]] = None
    ) -> AuditRecord:
        """Appends a new event record to the hash-chained audit log."""
        record = AuditRecord(
            event_type=event_type,
            source_domain=source,
            destination_domain=destination,
            path=path,
            method=method,
            allowed=allowed,
            subject=subject,
            status_code=status_code,
            reason=reason,
            details=details or {},
            prev_hash=self.last_hash
        )

        rec_dict = record.model_dump()
        rec_hash = self.compute_record_hash(self.last_hash, rec_dict)
        record.hash = rec_hash
        rec_dict["hash"] = rec_hash

        with open(self.log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(rec_dict) + "\n")

        self.last_hash = rec_hash
        return record

    def read_records(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        if not os.path.exists(self.log_path):
            return []

        records = []
        with open(self.log_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        records.append(json.loads(line))
                    except Exception:
                        pass
        return records[offset:offset+limit]

    def verify_integrity(self) -> ChainVerificationResult:
        """
        Replays the entire audit log from genesis to latest record.
        Verifies:
        1. Every record correctly references the previous record's hash.
        2. Every record's hash matches SHA-256(prev_hash || canonical_json(data)).
        """
        if not os.path.exists(self.log_path) or os.path.getsize(self.log_path) == 0:
            return ChainVerificationResult(
                valid=True,
                total_records=0,
                verified_records=0,
                genesis_hash=GENESIS_HASH,
                latest_hash=GENESIS_HASH
            )

        errors = []
        expected_prev = GENESIS_HASH
        count = 0

        with open(self.log_path, 'r', encoding='utf-8') as f:
            for idx, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue

                try:
                    rec = json.loads(line)
                except Exception as e:
                    errors.append(f"Line {idx}: JSON parse error: {str(e)}")
                    continue

                rec_prev = rec.get("prev_hash", "")
                rec_hash = rec.get("hash", "")

                # Check previous hash link
                if rec_prev != expected_prev:
                    errors.append(
                        f"Line {idx} (event {rec.get('event_id')}): Chain link broken. "
                        f"Expected prev_hash {expected_prev[:12]}..., found {rec_prev[:12]}..."
                    )

                # Recompute and compare hash
                computed = self.compute_record_hash(rec_prev, rec)
                if computed != rec_hash:
                    errors.append(
                        f"Line {idx} (event {rec.get('event_id')}): Tampering detected! "
                        f"Expected hash {computed[:12]}..., recorded hash {rec_hash[:12]}..."
                    )

                expected_prev = rec_hash
                count += 1

        return ChainVerificationResult(
            valid=len(errors) == 0,
            total_records=count,
            verified_records=count if len(errors) == 0 else 0,
            genesis_hash=GENESIS_HASH,
            latest_hash=expected_prev,
            errors=errors
        )