$ErrorActionPreference = "Stop"
$AppDir = Join-Path $PSScriptRoot "trustx-ai-studio-ui"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js/npm not found. Install Node.js LTS from https://nodejs.org/ and reopen PowerShell." -ForegroundColor Red
  exit 1
}
Set-Location $AppDir
if (-not (Test-Path "node_modules")) {
  npm install
}
npm run dev
