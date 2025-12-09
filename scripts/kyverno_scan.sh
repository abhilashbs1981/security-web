#!/bin/bash

# Script to run Kyverno scan and generate deduplicated JSON report

set -e

OUTPUT_DIR="${OUTPUT_DIR:-../new}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
KYVERNO_POLICY_DIR="${SCRIPT_DIR}/kyvernopolicy"

mkdir -p "$OUTPUT_DIR/kyverno-report"
cd "$OUTPUT_DIR/kyverno-report"

echo "Generating all-resources.yaml..."
kubectl get pods -A -o json | python3 "$SCRIPT_DIR/kyverno_k8s_resources_to_yaml.py" > all-resources.yaml

echo "Running Kyverno scan..."
# Run kyverno apply
# Note: Redirecting stderr to stdout to capture potential warnings, but primarily we want the output file
kyverno apply "$KYVERNO_POLICY_DIR" --resource ./all-resources.yaml --policy-report > policy-report.yaml || true

# Remove first 5 lines (as per user instruction, likely to remove header/logs)
tail -n +6 policy-report.yaml > policy-report.clean.yaml
mv policy-report.clean.yaml policy-report.yaml

echo "Validating YAML..."
python3 -c "import yaml; yaml.safe_load(open('policy-report.yaml'))" && echo "Valid YAML"

echo "Converting to JSON and deduplicating..."
cat policy-report.yaml | python3 "$SCRIPT_DIR/kyverno_yaml_to_json_dedup.py" > kyverno.json

echo "Zipping Kyverno report..."
zip -q kyverno.zip kyverno.json
rm kyverno.json
rm all-resources.yaml
rm policy-report.yaml

echo "Kyverno report saved to: $OUTPUT_DIR/kyverno-report/kyverno.zip"
