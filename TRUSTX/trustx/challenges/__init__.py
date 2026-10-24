"""TrustX Challenge Framework

Shared infrastructure for Red Team and Blue Team challenges.
"""

from .base import ChallengeRegistry, compute_flag, CHALLENGE_SECRET, FLAG_PREFIX, registry
from .linux_recon_1 import linux_recon_1_challenge
from .web_auth_bypass_1 import web_auth_bypass_1_challenge
from .web_input_validation_1 import web_input_validation_1_challenge
from .web_attack_chain_1 import web_attack_chain_1_challenge
from .linux_privesc_1 import linux_privesc_1_challenge
from .log_triage_1 import log_triage_1_challenge
from .bruteforce_detection_1 import bruteforce_detection_1_challenge
from .web_attack_investigation_1 import web_attack_investigation_1_challenge
from .incident_timeline_1 import incident_timeline_1_challenge

# Auto-register all challenges
registry.register(linux_recon_1_challenge)
registry.register(web_auth_bypass_1_challenge)
registry.register(web_input_validation_1_challenge)
registry.register(web_attack_chain_1_challenge)
registry.register(linux_privesc_1_challenge)
registry.register(log_triage_1_challenge)
registry.register(bruteforce_detection_1_challenge)
registry.register(web_attack_investigation_1_challenge)
registry.register(incident_timeline_1_challenge)