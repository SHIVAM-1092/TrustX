"""Configuration loader for TrustX Policy Gateway"""

import os
import yaml
from pydantic import BaseModel
from typing import Dict, Optional

class ServerConfig(BaseModel):
    address: str = ":8443"
    read_timeout: int = 10
    write_timeout: int = 10
    idle_timeout: int = 60

class TLSConfig(BaseModel):
    ca_cert: str = "/certs/ca.crt"
    ca_key: str = "/certs/ca.key"
    server_cert: str = "/certs/gateway.crt"
    server_key: str = "/certs/gateway.key"
    client_ca: str = "/certs/ca.crt"

class AuditConfig(BaseModel):
    log_path: str = "/audit/audit.log"
    max_entry_size: int = 1048576
    flush_interval: int = 1

class PolicyConfig(BaseModel):
    path: str = "/config/policy.yaml"
    reload_interval: int = 30

class UpstreamConfig(BaseModel):
    url: str
    domain: str
    timeout: float = 30.0

class GatewayConfig(BaseModel):
    server: ServerConfig = ServerConfig()
    tls: TLSConfig = TLSConfig()
    audit: AuditConfig = AuditConfig()
    policy: PolicyConfig = PolicyConfig()
    upstreams: Dict[str, UpstreamConfig] = {}

def load_config(path: str) -> GatewayConfig:
    if os.path.exists(path):
        with open(path, 'r') as f:
            data = yaml.safe_load(f) or {}
            cfg = GatewayConfig(**data)
    else:
        cfg = GatewayConfig()

    # Resolve relative paths for container-style entries (starting with '/') when running locally
    def resolve_path(p: str) -> str:
        if os.path.isabs(p):
            # Try absolute first; if not found, treat as relative to project root
            if not os.path.exists(p):
                rel = os.path.join(os.getcwd(), p.lstrip('/'))
                return rel if os.path.exists(rel) else p
            return p
        return p

    cfg.audit.log_path = resolve_path(cfg.audit.log_path)
    cfg.policy.path = resolve_path(cfg.policy.path)
    # Upstream URLs are full URLs, no change needed

    # Environment overrides
    if log_path := os.getenv("AUDIT_LOG_PATH"):
        cfg.audit.log_path = log_path
    if policy_path := os.getenv("POLICY_PATH"):
        cfg.policy.path = policy_path

    # Upstream overrides from env
    if red_url := os.getenv("RED_TEAM_URL"):
        cfg.upstreams["red"] = UpstreamConfig(url=red_url, domain="red")
    if target_url := os.getenv("TARGET_URL"):
        cfg.upstreams["target"] = UpstreamConfig(url=target_url, domain="target")
    if blue_url := os.getenv("BLUE_TEAM_URL"):
        cfg.upstreams["blue"] = UpstreamConfig(url=blue_url, domain="blue")

    return cfg