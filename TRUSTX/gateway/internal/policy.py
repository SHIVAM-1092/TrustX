"""Server-side Default-Deny Policy Engine for TrustX

Evaluates cross-domain authorization rules sequentially.
Defaults to DENY on any error, missing rule, or parse failure (fail-closed).
"""

import os
import yaml
import fnmatch
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .identity import Domain

class PolicyRule(BaseModel):
    name: str
    description: str = ""
    source_domain: str
    destination_domain: str
    allowed_paths: List[str] = []
    allowed_methods: List[str] = ["GET", "POST"]
    action: str = "DENY"  # "ALLOW" or "DENY"

class PolicyEngine:
    def __init__(self, policy_path: str):
        self.policy_path = policy_path
        self.rules: List[PolicyRule] = []
        self.default_action: str = "DENY"
        self.load_policy()

    def load_policy(self) -> bool:
        """Loads policy from YAML. Returns True if successfully loaded."""
        if not os.path.exists(self.policy_path):
            self.rules = []
            return False

        try:
            with open(self.policy_path, 'r') as f:
                data = yaml.safe_load(f) or {}

            self.default_action = data.get("default_action", "DENY").upper()
            raw_rules = data.get("rules", [])

            self.rules = [
                PolicyRule(
                    name=r.get("name", "unnamed"),
                    description=r.get("description", ""),
                    source_domain=r.get("source_domain", "*"),
                    destination_domain=r.get("destination_domain", "*"),
                    allowed_paths=r.get("allowed_paths", ["*"]),
                    allowed_methods=r.get("allowed_methods", ["*"]),
                    action=r.get("action", "DENY").upper()
                )
                for r in raw_rules
            ]
            return True
        except Exception as e:
            # Fail closed: clear rules on parse failure
            self.rules = []
            self.default_action = "DENY"
            return False

    def is_loaded(self) -> bool:
        return len(self.rules) > 0

    def evaluate(self, source: Domain, destination: Domain, path: str, method: str) -> bool:
        """
        Evaluates authorization request against policy rules.
        First matching rule determines the outcome.
        Returns True if ALLOWED, False if DENIED (fail-closed).
        """
        src_val = source.value if isinstance(source, Domain) else str(source)
        dst_val = destination.value if isinstance(destination, Domain) else str(destination)
        method_val = method.upper()

        for rule in self.rules:
            # Match source domain
            if rule.source_domain != "*" and rule.source_domain != src_val:
                continue

            # Match destination domain
            if rule.destination_domain != "*" and rule.destination_domain != dst_val:
                continue

            # Match method
            if rule.allowed_methods and "*" not in rule.allowed_methods:
                if method_val not in [m.upper() for m in rule.allowed_methods]:
                    continue

            # Match path glob
            path_matched = False
            for allowed_pattern in rule.allowed_paths:
                if allowed_pattern == "*" or fnmatch.fnmatch(path, allowed_pattern):
                    path_matched = True
                    break

            if not path_matched:
                continue

            # Match found! Return rule action
            return rule.action.upper() == "ALLOW"

        # No rule matched -> apply default action (default-deny)
        return self.default_action == "ALLOW"