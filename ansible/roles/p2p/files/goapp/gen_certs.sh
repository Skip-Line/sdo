#!/bin/bash

set -e

CA_DIR="./ca"
CERTS_DIR="./certs"
PEER_IP=$1

if [[ -z "$PEER_IP" ]]; then
  echo "Usage: $0 <peer-ip>"
  exit 1
fi

mkdir -p "$CA_DIR" "$CERTS_DIR"

### Step 1: Generate CA (if not already exists)
if [[ ! -f "$CA_DIR/ca.key" ]]; then
  echo "[*] Generating Root CA..."
  openssl genrsa -out "$CA_DIR/ca.key" 4096
  openssl req -x509 -new -nodes -key "$CA_DIR/ca.key" -sha256 -days 3650 \
    -out "$CA_DIR/ca.crt" -subj "/C=US/ST=State/O=QUICCA/CN=QUICRootCA"
else
  echo "[*] Root CA already exists."
fi

### Step 2: Create OpenSSL config with IP SAN
SAN_CONFIG=$(mktemp)
cat > "$SAN_CONFIG" <<EOF
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
req_extensions     = req_ext
distinguished_name = dn

[dn]
C = US
ST = State
L = City
O = QUICOrg
CN = $PEER_IP

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = $PEER_IP
EOF

### Step 3: Generate peer key + CSR
PEER_BASENAME=$(echo "$PEER_IP" | tr '.' '_')
PEER_KEY="$CERTS_DIR/$PEER_BASENAME.key"
PEER_CSR="$CERTS_DIR/$PEER_BASENAME.csr"
PEER_CRT="$CERTS_DIR/$PEER_BASENAME.crt"

echo "[*] Generating cert for peer $PEER_IP..."
openssl genrsa -out "$PEER_KEY" 2048
openssl req -new -key "$PEER_KEY" -out "$PEER_CSR" -config "$SAN_CONFIG"

### Step 4: Sign peer cert with CA (add SAN via extfile)
EXT_CONFIG=$(mktemp)
cat > "$EXT_CONFIG" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = IP:$PEER_IP
EOF

openssl x509 -req -in "$PEER_CSR" -CA "$CA_DIR/ca.crt" -CAkey "$CA_DIR/ca.key" \
  -CAcreateserial -out "$PEER_CRT" -days 365 -sha256 -extfile "$EXT_CONFIG"

rm "$SAN_CONFIG" "$EXT_CONFIG"

echo "[✔] Certificate created: $PEER_CRT"
echo "[✔] Private key: $PEER_KEY"
echo "[✔] CA certificate (for TLS trust): $CA_DIR/ca.crt"
