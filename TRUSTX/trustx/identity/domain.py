"""TrustX Security Domains, Identifiers, and Common Types"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Domain(str, Enum):
    RED = "red"
    TARGET = "target"
    BLUE = "blue"
    GATEWAY = "gateway"
    UI = "ui"

    @classmethod
    def all_domains(cls) -> List[str]:
        return [d.value for d in cls]

    @classmethod
    def is_valid(cls, value: str) -> bool:
        return value.lower() in cls.all_domains()

class DomainIdentity(BaseModel):
    domain: Domain
    subject: str
    auth_method: str = "token"  # "mtls" or "token"
    role: Optional[str] = None
    claims: Dict[str, Any] = Field(default_factory=dict)