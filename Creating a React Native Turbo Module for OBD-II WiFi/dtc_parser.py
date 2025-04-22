#!/usr/bin/env python3
"""
DTC Parser - Extracts and processes Diagnostic Trouble Codes from multiple sources
to create a comprehensive database for the OBD-II application.
"""

import re
import json
import os
from collections import defaultdict

# Define the input and output files
INPUT_FILES = {
    'primary': '/home/ubuntu/obd_guide_enhanced/dtc_database/dtc_codes_extracted.txt',
    'new_2007': '/home/ubuntu/obd_guide_enhanced/dtc_database/new_2007_codes.txt',
    'rac': '/home/ubuntu/obd_guide_enhanced/dtc_database/rac_codes.txt'
}

OUTPUT_FILE = '/home/ubuntu/obd_guide_enhanced/dtc_database/dtc_database.json'

# Regular expressions for parsing different formats
DTC_PATTERN = r'P(\d{4})'
DTC_TITLE_PATTERN = r'P(\d{4})\s*-\s*(.+?)(?:\n|$)'
DESCRIPTION_PATTERN = r'Description:\s*(.+?)(?:\n\s*Possible|\n\s*Diagnostic|\n\s*Application|\n\s*$)'
POSSIBLE_CAUSES_PATTERN = r'Possible\s+Causes:\s*(.+?)(?:\n\s*Diagnostic|\n\s*Application|\n\s*$)'
DIAGNOSTIC_AIDS_PATTERN = r'Diagnostic\s+Aids:\s*(.+?)(?:\n\s*Application|\n\s*$)'

# Simple format from new_2007_codes.txt
SIMPLE_DTC_PATTERN = r'P(\d{4})\s+(.+?)(?:\n|$)'

def clean_text(text):
    """Clean up text by removing extra whitespace and normalizing line endings."""
    if not text:
        return ""
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    return text.strip()

def extract_dtcs_from_primary():
    """Extract DTCs from the primary source (dtc_codes_extracted.txt)."""
    dtcs = {}
    
    try:
        with open(INPUT_FILES['primary'], 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find all DTC blocks
        blocks = re.split(r'P\d{4}\s*-', content)
        if blocks:
            blocks = blocks[1:]  # Skip the header
            
        # Process each block
        for i, block in enumerate(blocks):
            # Add back the P code that was removed in the split
            match = re.search(DTC_PATTERN, content)
            if match and i < len(re.findall(r'P\d{4}\s*-', content)):
                code = 'P' + re.findall(r'P(\d{4})\s*-', content)[i]
                
                # Extract title
                title_match = re.search(r'^(.+?)(?:\n|$)', block)
                title = title_match.group(1).strip() if title_match else ""
                
                # Extract description
                desc_match = re.search(DESCRIPTION_PATTERN, block)
                description = clean_text(desc_match.group(1)) if desc_match else ""
                
                # Extract possible causes
                causes_match = re.search(POSSIBLE_CAUSES_PATTERN, block)
                causes = clean_text(causes_match.group(1)) if causes_match else ""
                
                # Extract diagnostic aids
                aids_match = re.search(DIAGNOSTIC_AIDS_PATTERN, block)
                aids = clean_text(aids_match.group(1)) if aids_match else ""
                
                # Store the DTC information
                dtcs[code] = {
                    'code': code,
                    'title': title,
                    'description': description,
                    'possible_causes': causes.split('\n'),
                    'diagnostic_aids': aids,
                    'source': 'primary'
                }
    except Exception as e:
        print(f"Error processing primary source: {e}")
    
    return dtcs

def extract_dtcs_from_new_2007():
    """Extract DTCs from the 2007 updated codes source."""
    dtcs = {}
    
    try:
        with open(INPUT_FILES['new_2007'], 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all DTCs in the simple format
        matches = re.finditer(r'P(\d{4})\s+(.+?)(?:\n|$)', content)
        
        for match in matches:
            code = 'P' + match.group(1)
            description = clean_text(match.group(2))
            
            # Store the DTC information
            dtcs[code] = {
                'code': code,
                'title': description,
                'description': description,
                'possible_causes': [],
                'diagnostic_aids': '',
                'source': 'new_2007'
            }
    except Exception as e:
        print(f"Error processing 2007 source: {e}")
    
    return dtcs

def extract_dtcs_from_rac():
    """Extract DTCs from the RAC source if available."""
    # This source appears to be a user manual rather than a direct DTC database
    # We'll return an empty dict for now
    return {}

def merge_dtc_databases(primary_dtcs, new_2007_dtcs, rac_dtcs):
    """Merge DTC databases from different sources, prioritizing more detailed information."""
    merged_dtcs = {}
    
    # Start with primary DTCs
    merged_dtcs.update(primary_dtcs)
    
    # Add or update with 2007 DTCs
    for code, dtc_info in new_2007_dtcs.items():
        if code in merged_dtcs:
            # If the primary source doesn't have a description, use the one from 2007
            if not merged_dtcs[code]['description'] and dtc_info['description']:
                merged_dtcs[code]['description'] = dtc_info['description']
            
            # Update the sources list
            merged_dtcs[code]['source'] = f"{merged_dtcs[code]['source']},new_2007"
        else:
            # Add new DTC
            merged_dtcs[code] = dtc_info
    
    # Add or update with RAC DTCs
    for code, dtc_info in rac_dtcs.items():
        if code in merged_dtcs:
            # Update the sources list
            merged_dtcs[code]['source'] = f"{merged_dtcs[code]['source']},rac"
        else:
            # Add new DTC
            merged_dtcs[code] = dtc_info
    
    return merged_dtcs

def categorize_dtcs(dtcs):
    """Categorize DTCs by their first digit after the P."""
    categories = {
        '0': 'Generic OBD-II',
        '1': 'Manufacturer Specific',
        '2': 'Generic OBD-II (includes P0XXX codes)',
        '3': 'Generic OBD-II and Manufacturer Specific'
    }
    
    categorized = defaultdict(list)
    
    for code, info in dtcs.items():
        if code.startswith('P'):
            category_digit = code[1]
            category = categories.get(category_digit, 'Unknown')
            categorized[category].append(info)
    
    return dict(categorized)

def main():
    """Main function to extract and process DTCs."""
    print("Extracting DTCs from primary source...")
    primary_dtcs = extract_dtcs_from_primary()
    print(f"Extracted {len(primary_dtcs)} DTCs from primary source.")
    
    print("Extracting DTCs from 2007 updated codes...")
    new_2007_dtcs = extract_dtcs_from_new_2007()
    print(f"Extracted {len(new_2007_dtcs)} DTCs from 2007 updated codes.")
    
    print("Extracting DTCs from RAC source...")
    rac_dtcs = extract_dtcs_from_rac()
    print(f"Extracted {len(rac_dtcs)} DTCs from RAC source.")
    
    print("Merging DTC databases...")
    merged_dtcs = merge_dtc_databases(primary_dtcs, new_2007_dtcs, rac_dtcs)
    print(f"Merged database contains {len(merged_dtcs)} unique DTCs.")
    
    print("Categorizing DTCs...")
    categorized_dtcs = categorize_dtcs(merged_dtcs)
    
    # Create the final database structure
    dtc_database = {
        'metadata': {
            'total_codes': len(merged_dtcs),
            'sources': ['primary', 'new_2007', 'rac'],
            'categories': list(categorized_dtcs.keys())
        },
        'codes': list(merged_dtcs.values()),
        'categorized': categorized_dtcs
    }
    
    # Save the database to a JSON file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(dtc_database, f, indent=2)
    
    print(f"DTC database saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
