FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy gateway package
COPY gateway ./gateway

# Copy shared trustx package for imports
COPY trustx ./trustx

# Copy healthcheck script
COPY gateway/healthcheck.py /app/gateway/healthcheck.py

EXPOSE 8443

# Run with TLS using certificates (--ssl-cert-reqs 2 = require client cert verification)
CMD ["uvicorn", "gateway.main:app", "--host", "0.0.0.0", "--port", "8443", "--ssl-certfile", "/certs/gateway.crt", "--ssl-keyfile", "/certs/gateway.key", "--ssl-ca-certs", "/certs/ca.crt", "--ssl-cert-reqs", "2"]