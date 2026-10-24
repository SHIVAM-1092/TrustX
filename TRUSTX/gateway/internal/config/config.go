package config

import (
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

// GatewayConfig holds all gateway configuration
type GatewayConfig struct {
	Server   ServerConfig   `yaml:"server"`
	TLS      TLSConfig      `yaml:"tls"`
	Audit    AuditConfig    `yaml:"audit"`
	Policy   PolicyConfig   `yaml:"policy"`
	Upstreams UpstreamsConfig `yaml:"upstreams"`
	Health   HealthConfig   `yaml:"health"`
}

type ServerConfig struct {
	Address       string        `yaml:"address"`
	ReadTimeout   time.Duration `yaml:"read_timeout"`
	WriteTimeout  time.Duration `yaml:"write_timeout"`
	IdleTimeout   time.Duration `yaml:"idle_timeout"`
}

type TLSConfig struct {
	CACert     string `yaml:"ca_cert"`
	CAKey      string `yaml:"ca_key"`
	ServerCert string `yaml:"server_cert"`
	ServerKey  string `yaml:"server_key"`
	ClientCA   string `yaml:"client_ca"`
}

type AuditConfig struct {
	LogPath        string        `yaml:"log_path"`
	MaxEntrySize   int           `yaml:"max_entry_size"`
	FlushInterval  time.Duration `yaml:"flush_interval"`
}

type PolicyConfig struct {
	Path           string        `yaml:"path"`
	ReloadInterval time.Duration `yaml:"reload_interval"`
}

type UpstreamsConfig struct {
	Red    UpstreamConfig `yaml:"red"`
	Target UpstreamConfig `yaml:"target"`
	Blue   UpstreamConfig `yaml:"blue"`
}

type UpstreamConfig struct {
	URL      string        `yaml:"url"`
	Domain   string        `yaml:"domain"`
	Timeout  time.Duration `yaml:"timeout"`
}

type HealthConfig struct {
	Enabled bool   `yaml:"enabled"`
	Path    string `yaml:"path"`
}

// Load loads configuration from file, with environment variable overrides
func Load(path string) (*GatewayConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg GatewayConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	// Environment variable overrides
	if v := os.Getenv("GATEWAY_CONFIG"); v != "" {
		// Config path override handled by caller
	}
	if v := os.Getenv("AUDIT_LOG_PATH"); v != "" {
		cfg.Audit.LogPath = v
	}
	if v := os.Getenv("POLICY_PATH"); v != "" {
		cfg.Policy.Path = v
	}

	return &cfg, nil
}