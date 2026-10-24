"""TrustX Default-Deny Policy Engine

Evaluates all authorization decisions against strict rules.
Defaults to DENY on any error, missing rule, or unknown domain (Fail-Closed).
"""

import os
import yaml
import fnmatch
from typing import List, Optional
from pydantic import BaseModel, Field
from ..identity.domain import Domain

class PolicyRule(BaseModel):
    name: str
    description: str = ""
    source_domain: str
    destination_domain: str
    allowed_paths: List[str] = Field(default_factory=list)
    allowed_methods: List[str] = Field(default_factory=lambda: ["GET", "POST"])
    action: str = "DENY"

class PolicyEvaluationResult(BaseModel):
    allowed: bool
    rule_name: Optional[str] = None
    reason: str
    source: str
    destination: str
    path: str
    method: str

class PolicyEngine:
    def __init__(self, policy_path: Optional[str] = None):
        self.policy_path = policy_path
        self.rules: List[PolicyRule] = []
        self.default_action: str = "DENY"
        if policy_path and os.path.exists(policy_path):
            self.load_policy(policy_path)

    def load_policy(self, path: str) -> bool:
        """Loads and parses policy rules from a YAML file."""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f) or {}

            self.default_action = data.get("default_action", "DENY").upper()
            raw_rules = data.get("rules", [])

            self.rules = [
                PolicyRule(
                    name=r.get("name", "unnamed-rule"),
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
        except Exception:
            # Fail closed: on any parse error, drop all rules and deny all
            self.rules = []
            self.default_action = "DENY"
            return False

    def evaluate(
        self,
        source: Domain,
        destination: Domain,
        path: str,
        method: str
    ) -> PolicyEvaluationResult:
        """
        Sequentially evaluates rules against request context.
        Returns PolicyEvaluationResult with allow/deny decision and explanation.
        """
        src_str = source.value if isinstance(source, Domain) else str(source).lower()
        dst_str = destination.value if isinstance(destination, Domain) else str(destination).lower()
        method_str = method.upper()

        # Hardcoded boundary invariants from CLAUDE.md §4:
        # 1. Red-to-Blue and Blue-to-Red access MUST BE DENIED
        if (src_str == "red" and dst_str == "blue") or (src_str == "blue" and dst_str == "red"):
            return PolicyEvaluationResult(
                allowed=False,
                rule_name="invariant-red-blue-prohibited",
                reason="Strict domain separation: Direct cross-domain access between Red and Blue is prohibited",
                source=src_str,
                destination=dst_str,
                path=path,
                method=method_str
            )

        # 2. Target-to-Red and Target-to-Blue access MUST BE DENIED
        if src_str == "target" and dst_str in ["red", "blue"]:
            return PolicyEvaluationResult(
                allowed=False,
                rule_name="invariant-target-egress-prohibited",
                reason="Target isolation: Target domain cannot initiate requests to Red or Blue domains",
                source=src_str,
                destination=dst_str,
                path=path,
                method=method_str
            )

        # Evaluate configurable rules
        for rule in self.rules:
            # Match source
            if rule.source_domain != "*" and rule.source_domain.lower() != src_str:
                continue

            # Match destination
            if rule.destination_domain != "*" and rule.destination_domain.lower() != dst_str:
                continue

            # Match HTTP method
            if rule.allowed_methods and "*" not in rule.allowed_methods:
                if method_str not in [m.upper() for m in rule.allowed_methods]:
                    continue

            # Match Path
            path_matched = False
            for allowed_pattern in rule.allowed_paths:
                if allowed_pattern == "*" or fnmatch.fnmatch(path, allowed_pattern):
                    path_matched = True
                    break

            if not path_matched:
                continue

            # First match determines action
            is_allow = rule.action.upper() == "ALLOW"
            return PolicyEvaluationResult(
                allowed=is_allow,
                rule_name=rule.name,
                reason=f"Matched policy rule '{rule.name}' with action {rule.action}",
                source=src_str,
                destination=dst_str,
                path=path,
                method=method_str
            )

        # Default-deny fallthrough
        return PolicyEvaluationResult(
            allowed=False,
            rule_name="default-deny",
            reason="No explicit ALLOW rule matched request (Default-Deny policy)",
            source=src_str,
            destination=dst_str,
            path=path,
            method=method_str
        )