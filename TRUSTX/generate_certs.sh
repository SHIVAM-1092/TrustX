#!/usr/bin/env bash
# generate_certs.sh - Generates self-signed mTLS certificates for TrustX
# Run this once before starting Docker Compose

set -euo pipefail

CERT_DIR="./gateway/certs"
mkdir -p "$CERT_DIR" ./red-team/certs ./target/certs ./blue-team/certs

echo "==> Generating Certificate Authority (CA)..."
openssl genrsa -out "$CERT_DIR/ca.key" 4096
openssl req -new -x509 -days 365 -key "$CERT_DIR/ca.key" -out "$CERT_DIR/ca.crt" \
    -subj "/CN=TrustX-CA/O=TrustX/C=US"

echo "==> Generating Gateway Server Certificate..."
openssl genrsa -out "$CERT_DIR/gateway.key" 2048
openssl req -new -key "$CERT_DIR/gateway.key" -out "$CERT_DIR/gateway.csr" \
    -subj "/CN=gateway/O=TrustX/C=US"
openssl x509 -req -days 365 -in "$CERT_DIR/gateway.csr" \
    -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
    -out "$CERT_DIR/gateway.crt" -extfile <(printf "subjectAltName=DNS:gateway,DNS:localhost,IP:127.0.0.1")

# Function to generate server cert for a domain (with SAN for Docker service name)
generate_server_cert() {
    local domain=$1
    local out_dir=$2
    local docker_name=$3
    echo "==> Generating Server Certificate for domain: $domain (Docker name: $docker_name)..."
    openssl genrsa -out "$out_dir/$domain.key" 2048
    openssl req -new -key "$out_dir/$domain.key" -out "$out_dir/$domain.csr" \
        -subj "/CN=$domain/O=TrustX/C=US"
    openssl x509 -req -days 365 -in "$out_dir/$domain.csr" \
        -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
        -out "$out_dir/$domain.crt" -extfile <(printf "subjectAltName=DNS:$docker_name,DNS:$domain,DNS:localhost,IP:127.0.0.1")
    rm -f "$out_dir/$domain.csr"

    # Also copy CA cert to domain dir for verification
    cp "$CERT_DIR/ca.crt" "$out_dir/ca.crt"
}

# Function to generate client cert for a domain (for mTLS client auth)
generate_client_cert() {
    local domain=$1
    local out_dir=$2
    echo "==> Generating Client Certificate for domain: $domain..."
    openssl genrsa -out "$out_dir/$domain-client.key" 2048
    openssl req -new -key "$out_dir/$domain-client.key" -out "$out_dir/$domain-client.csr" \
        -subj "/CN=$domain-client/O=TrustX/OU=$domain/C=US"
    openssl x509 -req -days 365 -in "$out_dir/$domain-client.csr" \
        -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
        -out "$out_dir/$domain-client.crt"
    rm -f "$out_dir/$domain-client.csr"

    # Also copy CA cert to domain dir for verification
    cp "$CERT_DIR/ca.crt" "$out_dir/ca.crt"
}

# Generate server certificates (for HTTPS servers)
generate_server_cert "red" "./red-team/certs" "red-team"
generate_server_cert "target" "./target/certs" "target"
generate_server_cert "blue" "./blue-team/certs" "blue-team"

# Generate client certificates (for mTLS client authentication)
generate_client_cert "red" "./red-team/certs"
generate_client_cert "target" "./target/certs"
generate_client_cert "blue" "./blue-team/certs"

# Clean up CSRs
rm -f "$CERT_DIR/gateway.csr" "$CERT_DIR/ca.srl"

echo "==> All certificates generated successfully!"
echo "    CA: $CERT_DIR/ca.crt"
echo "    Gateway: $CERT_DIR/gateway.crt"
echo "    Red Team Server: ./red-team/certs/red.crt"
echo "    Red Team Client: ./red-team/certs/red-client.crt"
echo "    Target Server: ./target/certs/target.crt"
echo "    Target Client: ./target/certs/target-client.crt"
echo "    Blue Team Server: ./blue-team/certs/blue.crt"
echo "    Blue Team Client: ./blue-team/certs/blue-client.crt"