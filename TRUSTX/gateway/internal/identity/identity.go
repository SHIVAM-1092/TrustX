package identity

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Domain represents a security domain in TrustX
type Domain string

const (
	DomainRed    Domain = "red"
	DomainTarget Domain = "target"
	DomainBlue   Domain = "blue"
	DomainUI     Domain = "ui"
	DomainGateway Domain = "gateway"
)

// KnownDomains returns all valid domains
func KnownDomains() []Domain {
	return []Domain{DomainRed, DomainTarget, DomainBlue, DomainUI, DomainGateway}
}

// IsValidDomain checks if a domain is known
func IsValidDomain(d Domain) bool {
	for _, known := range KnownDomains() {
		if d == known {
			return true
		}
	}
	return false
}

// DomainIdentity represents a validated domain identity
type DomainIdentity struct {
	Domain       Domain
	Subject      string
	Certificates []*x509.Certificate
	ExpiresAt    time.Time
	Claims       *DomainClaims
}

// DomainClaims are the JWT claims for domain identity
type DomainClaims struct {
	jwt.RegisteredClaims
	Domain Domain `json:"domain"`
	Role   string `json:"role,omitempty"`
}

// VerifyMTLSIdentity validates a client certificate and extracts domain identity
func VerifyMTLSIdentity(certPEM []byte, caPool *x509.CertPool) (*DomainIdentity, error) {
	block, _ := pem.Decode(certPEM)
	if block == nil || block.Type != "CERTIFICATE" {
		return nil, errors.New("invalid certificate PEM")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse certificate: %w", err)
	}

	// Verify against CA
	opts := x509.VerifyOptions{
		Roots:         caPool,
		Intermediates: x509.NewCertPool(),
		KeyUsages:     []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
		CurrentTime:   time.Now(),
	}
	chains, err := cert.Verify(opts)
	if err != nil {
		return nil, fmt.Errorf("certificate verification failed: %w", err)
	}

	// Extract domain from certificate subject or SAN
	domain := extractDomainFromCert(cert)
	if domain == "" {
		return nil, errors.New("certificate missing domain identifier (OU or SAN)")
	}

	if !IsValidDomain(domain) {
		return nil, fmt.Errorf("unknown domain in certificate: %s", domain)
	}

	// Build identity from first valid chain
	var allCerts []*x509.Certificate
	for _, chain := range chains {
		allCerts = append(allCerts, chain...)
	}

	return &DomainIdentity{
		Domain:       domain,
		Subject:      cert.Subject.CommonName,
		Certificates: allCerts,
		ExpiresAt:    cert.NotAfter,
	}, nil
}

// extractDomainFromCert extracts domain from certificate OU or SAN
func extractDomainFromCert(cert *x509.Certificate) Domain {
	// Check OrganizationalUnit first
	for _, ou := range cert.Subject.OrganizationalUnit {
		if IsValidDomain(Domain(ou)) {
			return Domain(ou)
		}
	}

	// Check SANs for domain
	for _, san := range cert.DNSNames {
		// Expect format like "red-service", "target-service", etc.
		for _, d := range KnownDomains() {
			if san == string(d)+"-service" || san == string(d) {
				return d
			}
		}
	}

	return ""
}

// LoadCACertPool loads CA certificates for verification
func LoadCACertPool(caCertPath string) (*x509.CertPool, error) {
	caCertPEM, err := os.ReadFile(caCertPath)
	if err != nil {
		return nil, fmt.Errorf("read CA cert: %w", err)
	}

	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(caCertPEM) {
		return nil, errors.New("failed to append CA cert to pool")
	}

	return pool, nil
}

// VerifyJWTIdentity validates a JWT token and extracts domain identity
func VerifyJWTIdentity(tokenString string, signingKey interface{}) (*DomainIdentity, error) {
	token, err := jwt.ParseWithClaims(tokenString, &DomainClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return signingKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("JWT parse failed: %w", err)
	}

	claims, ok := token.Claims.(*DomainClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid JWT claims")
	}

	if !IsValidDomain(claims.Domain) {
		return nil, fmt.Errorf("invalid domain in JWT: %s", claims.Domain)
	}

	return &DomainIdentity{
		Domain:    claims.Domain,
		Subject:   claims.Subject,
		ExpiresAt: claims.ExpiresAt.Time,
		Claims:    claims,
	}, nil
}

// TLSConfigForMTLS returns a TLS config that requires and verifies client certs
func TLSConfigForMTLS(caCertPath, serverCertPath, serverKeyPath string) (*tls.Config, error) {
	caPool, err := LoadCACertPool(caCertPath)
	if err != nil {
		return nil, err
	}

	serverCert, err := tls.LoadX509KeyPair(serverCertPath, serverKeyPath)
	if err != nil {
		return nil, fmt.Errorf("load server cert: %w", err)
	}

	return &tls.Config{
		ClientAuth:   tls.RequireAndVerifyClientCert,
		ClientCAs:    caPool,
		Certificates: []tls.Certificate{serverCert},
		MinVersion:   tls.VersionTLS12,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
	}, nil
}

// TLSConfigForClient returns a TLS config for outbound mTLS connections
func TLSConfigForClient(caCertPath, clientCertPath, clientKeyPath string, serverName string) (*tls.Config, error) {
	caPool, err := LoadCACertPool(caCertPath)
	if err != nil {
		return nil, err
	}

	clientCert, err := tls.LoadX509KeyPair(clientCertPath, clientKeyPath)
	if err != nil {
		return nil, fmt.Errorf("load client cert: %w", err)
	}

	return &tls.Config{
		RootCAs:      caPool,
		Certificates: []tls.Certificate{clientCert},
		ServerName:   serverName,
		MinVersion:   tls.VersionTLS12,
	}, nil
}