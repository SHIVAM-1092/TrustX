import os
import dotenv

# Load .env file from repository root before any gateway imports
dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Set required environment variables for TrustX gateway
os.environ.setdefault('TRUSTX_SECRET_KEY', os.getenv('TRUSTX_SECRET_KEY', 'test-secret-for-pipeline'))
os.environ.setdefault('POLICY_PATH', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gateway/config/policy.yaml'))
os.environ.setdefault('GATEWAY_CONFIG', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'gateway/config/gateway.yaml'))
os.environ.setdefault('AUDIT_LOG_PATH', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'audit/audit.log'))