import pandas as pd
import json
from datetime import datetime

# Read the JSON file
with open('kyverno.json', 'r') as file:
    json_data = json.load(file)

# Extract the results from the items
all_results = []
for item in json_data.get('items', []):
    metadata = item.get('metadata', {})
    
    if 'results' in item:
        for result in item['results']:
            # Get resource details
            resources = result.get('resources', [{}])[0] if result.get('resources') else {}
            
            # Flatten the result dictionary
            flat_result = {
                # Metadata fields
                'report_name': metadata.get('name', ''),
                'report_namespace': metadata.get('namespace', ''),
                'report_creation_time': metadata.get('creationTimestamp', ''),
                'report_generation': metadata.get('generation', ''),
                'report_uid': metadata.get('uid', ''),
                'report_resource_version': metadata.get('resourceVersion', ''),
                
                # Owner reference fields
                'owner_kind': metadata.get('ownerReferences', [{}])[0].get('kind', '') if metadata.get('ownerReferences') else '',
                'owner_name': metadata.get('ownerReferences', [{}])[0].get('name', '') if metadata.get('ownerReferences') else '',
                'owner_uid': metadata.get('ownerReferences', [{}])[0].get('uid', '') if metadata.get('ownerReferences') else '',
                
                # Result fields
                'policy': result.get('policy', ''),
                'rule': result.get('rule', ''),
                'status': result.get('result', ''),
                'message': result.get('message', ''),
                'category': result.get('category', ''),
                'severity': result.get('severity', ''),
                'scoring': result.get('scoring', {}),
                
                # Resource fields
                'resource_api_version': resources.get('apiVersion', ''),
                'resource_kind': resources.get('kind', ''),
                'resource_name': resources.get('name', ''),
                'resource_namespace': resources.get('namespace', ''),
                'resource_uid': resources.get('uid', ''),
                'resource_labels': str(resources.get('labels', {})),
                'resource_annotations': str(resources.get('annotations', {})),
                
                # Additional fields
                'properties': str(result.get('properties', {})),
                'timestamp': result.get('timestamp', '')
            }
            all_results.append(flat_result)

# Convert to DataFrame
df = pd.DataFrame(all_results)

# Reorder columns for better readability
column_order = [
    'report_namespace', 'report_name', 'resource_namespace', 'resource_name', 
    'resource_kind', 'policy', 'rule', 'status', 'severity', 'category', 
    'message', 'timestamp', 'resource_api_version', 'resource_uid',
    'resource_labels', 'resource_annotations', 'report_creation_time',
    'report_generation', 'report_uid', 'report_resource_version',
    'owner_kind', 'owner_name', 'owner_uid', 'properties', 'scoring'
]

# Reorder columns (only include columns that exist in the DataFrame)
df = df[[col for col in column_order if col in df.columns]]

# Save to Excel with auto-adjusted column widths
with pd.ExcelWriter('kyverno_report.xlsx', engine='openpyxl') as writer:
    df.to_excel(writer, index=False, sheet_name='Policy Report')
    worksheet = writer.sheets['Policy Report']
    for idx, col in enumerate(df.columns):
        max_length = max(df[col].astype(str).apply(len).max(), len(col)) + 2
        worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)  # limit to 50 characters width

print("Conversion completed! Excel file has been created as 'kyverno_report.xlsx'")