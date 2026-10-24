FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8003

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--ssl-certfile", "/certs/blue.crt", "--ssl-keyfile", "/certs/blue.key", "--ssl-ca-certs", "/certs/ca.crt", "--ssl-cert-reqs", "1"]