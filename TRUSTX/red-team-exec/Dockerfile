FROM python:3.11-slim

# Install system dependencies for Red Team exercises
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    netcat-openbsd \
    nmap \
    dnsutils \
    iputils-ping \
    telnet \
    openssh-client \
    sqlmap \
    dirb \
    gobuster \
    ffuf \
    jq \
    vim \
    less \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -u 1000 -m -s /bin/bash labuser

# Create workspace directories
RUN mkdir -p /workspace/sessions /workspace/tools /workspace/wordlists /workspace/scripts && \
    chown -R labuser:labuser /workspace

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY exec_main.py .
COPY workspace/ /workspace/

# Switch to non-root user
USER labuser

EXPOSE 8081

CMD ["uvicorn", "exec_main:app", "--host", "0.0.0.0", "--port", "8081"]