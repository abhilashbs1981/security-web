#!/bin/bash

# Script to install security scanning tools and dependencies

set -e

SEPARATOR="================================================================================"
SUB_SEPARATOR="--------------------------------------------------------------------------------"

echo ""
echo "$SEPARATOR"
echo "                       Security Tools Installation Script"
echo "$SEPARATOR"
echo ""

# Install basic dependencies
echo "$SUB_SEPARATOR"
echo ">>> Checking Basic Dependencies"
echo "$SUB_SEPARATOR"
if ! dpkg -s wget gnupg jq zip >/dev/null 2>&1; then
    # Update system packages
    echo "Updating system packages..."
    sudo apt-get update
    echo "Installing missing dependencies..."
    sudo apt-get install -y wget gnupg jq zip nmap
else
    echo "Basic dependencies already installed."
fi
echo ""

# Install Trivy
echo "$SUB_SEPARATOR"
echo ">>> Installing Trivy"
echo "$SUB_SEPARATOR"
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin v0.68.1
echo ""

# Install kube-bench
echo "$SUB_SEPARATOR"
echo ">>> Installing kube-bench"
echo "$SUB_SEPARATOR"
KUBE_BENCH_DIR="/opt/kube-bench"
sudo mkdir -p "$KUBE_BENCH_DIR"
wget -q --show-progress https://github.com/aquasecurity/kube-bench/releases/download/v0.14.0/kube-bench_0.14.0_linux_amd64.tar.gz -O /tmp/kube-bench.tar.gz
sudo tar -xzf /tmp/kube-bench.tar.gz -C "$KUBE_BENCH_DIR"
sudo chmod +x "$KUBE_BENCH_DIR/kube-bench"
rm /tmp/kube-bench.tar.gz
echo "kube-bench installed at: $KUBE_BENCH_DIR"
echo ""

# Install kyverno CLI
echo "$SUB_SEPARATOR"
echo ">>> Installing Kyverno CLI"
echo "$SUB_SEPARATOR"
wget -q --show-progress https://github.com/kyverno/kyverno/releases/download/v1.10.0/kyverno-cli_v1.10.0_linux_x86_64.tar.gz -O /tmp/kyverno.tar.gz
tar -xzf /tmp/kyverno.tar.gz -C /tmp/
sudo mv /tmp/kyverno /usr/local/bin/
rm /tmp/kyverno.tar.gz
echo ""




echo "$SEPARATOR"
echo "                           Installation Complete"
echo "$SEPARATOR"
echo ""
echo "Installed Tools Summary:"
echo "$SUB_SEPARATOR"
echo "Trivy      : $(trivy --version | head -n 1)"
echo "kube-bench : $("$KUBE_BENCH_DIR/kube-bench" version)"
echo "Kyverno    : $(kyverno version | head -n 1)"
echo "Nmap       : $(nmap --version | head -n 1)"
echo "$SEPARATOR"
echo ""

