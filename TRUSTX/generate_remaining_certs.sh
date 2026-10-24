set -euo pipefail
for domain in red target blue; do
    case "$domain" in
        red) out_dir="./red-team/certs" ;;
        target) out_dir="./target/certs" ;;
        blue) out_dir="./blue-team/certs" ;;
    esac

    mkdir -p "$out_dir"
    echo "Generating $domain certificate..."
    openssl genrsa -out "$out_dir/$domain.key" 2048
    openssl req -new -key "$out_dir/$domain.key" -out "$out_dir/$domain.csr" \
        -subj "/CN=$domain-service/O=TrustX/OU=$domain/C=US"
    openssl x509 -req -days 365 -in "$out_dir/$domain.csr" \
        -CA ./gateway/certs/ca.crt -CAkey ./gateway/certs/ca.key \
        -CAcreateserial -out "$out_dir/$domain.crt"
    cp ./gateway/certs/ca.crt "$out_dir/ca.crt"
    rm -f "$out_dir/$domain.csr"
done
rm -f ./gateway/certs/gateway.csr ./gateway/certs/ca.srl
echo "Certificate generation complete."
