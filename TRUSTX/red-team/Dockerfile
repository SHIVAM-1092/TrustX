FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY red-team/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Red Team application code
COPY red-team/main.py .
COPY red-team/challenge.py .
COPY red-team/identity ./identity
COPY red-team/adversarial ./adversarial

# Copy shared trustx package for imports
COPY trustx ./trustx

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--ssl-certfile", "/certs/red.crt", "--ssl-keyfile", "/certs/red.key", "--ssl-ca-certs", "/certs/ca.crt", "--ssl-cert-reqs", "1"]