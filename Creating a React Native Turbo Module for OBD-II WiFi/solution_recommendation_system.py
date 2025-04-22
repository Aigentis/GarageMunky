#!/usr/bin/env python3
"""
Solution Recommendation System - Provides diagnostic solutions and repair recommendations
for identified OBD-II trouble codes.
"""

import json
import re
import os
from collections import defaultdict

# Define the input and output files
DTC_DATABASE_FILE = '/home/ubuntu/obd_guide_enhanced/dtc_database/dtc_database.json'
SOLUTION_DATABASE_FILE = '/home/ubuntu/obd_guide_enhanced/dtc_database/solution_database.json'

# Define categories for grouping similar issues
SYSTEM_CATEGORIES = {
    'P00': 'Fuel and Air Metering',
    'P01': 'Fuel and Air Metering',
    'P02': 'Fuel and Air Metering',
    'P03': 'Ignition System and Misfire Detection',
    'P04': 'Auxiliary Emissions Controls',
    'P05': 'Vehicle Speed Control and Idle Control',
    'P06': 'Computer Output Circuit',
    'P07': 'Transmission',
    'P08': 'Transmission',
    'P09': 'Vehicle Information',
    'P0A': 'Hybrid Propulsion',
    'P0B': 'Hybrid Propulsion',
    'P0C': 'Hybrid Propulsion',
    'P0D': 'Hybrid Propulsion',
    'P0E': 'Hybrid Propulsion',
    'P0F': 'Hybrid Propulsion',
}

# Define common repair procedures for different categories
COMMON_REPAIRS = {
    'Fuel and Air Metering': [
        {
            'procedure': 'Check for vacuum leaks',
            'description': 'Inspect all vacuum hoses and connections for cracks, loose connections, or damage.',
            'tools_needed': ['Vacuum gauge', 'Smoke machine (optional)'],
            'difficulty': 'Moderate',
            'estimated_time': '30-60 minutes',
            'steps': [
                'Visually inspect all vacuum hoses for cracks or damage',
                'Check all connections for proper seating',
                'Use a smoke machine if available to detect small leaks',
                'Replace any damaged hoses or connections',
                'Verify repair by clearing codes and testing'
            ]
        },
        {
            'procedure': 'Clean/replace Mass Air Flow (MAF) sensor',
            'description': 'The MAF sensor measures the amount of air entering the engine and can become contaminated over time.',
            'tools_needed': ['MAF sensor cleaner spray', 'Basic hand tools'],
            'difficulty': 'Easy',
            'estimated_time': '15-30 minutes',
            'steps': [
                'Locate the MAF sensor (typically between air filter box and intake)',
                'Disconnect the electrical connector',
                'Remove the sensor (usually secured with screws)',
                'Spray MAF cleaner on the sensing elements and allow to dry completely',
                'Reinstall the sensor and connector',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Replace oxygen (O2) sensor',
            'description': 'Oxygen sensors monitor exhaust gases and help the ECU adjust the air-fuel mixture.',
            'tools_needed': ['Oxygen sensor socket', 'Ratchet', 'Anti-seize compound'],
            'difficulty': 'Moderate',
            'estimated_time': '30-45 minutes',
            'steps': [
                'Locate the faulty O2 sensor (refer to vehicle manual)',
                'Disconnect the electrical connector',
                'Remove the sensor using an O2 sensor socket',
                'Apply a small amount of anti-seize compound to threads of new sensor',
                'Install new sensor and reconnect electrical connector',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Check fuel pressure',
            'description': 'Verify that the fuel system is delivering the correct pressure to the injectors.',
            'tools_needed': ['Fuel pressure gauge', 'Basic hand tools'],
            'difficulty': 'Moderate',
            'estimated_time': '30 minutes',
            'steps': [
                'Locate the fuel pressure test port (refer to vehicle manual)',
                'Relieve fuel system pressure following safety procedures',
                'Connect fuel pressure gauge to test port',
                'Start engine and compare reading to specifications',
                'If pressure is low, check fuel pump, filter, and regulator',
                'If pressure is high, check for a faulty pressure regulator'
            ]
        }
    ],
    'Ignition System and Misfire Detection': [
        {
            'procedure': 'Replace spark plugs',
            'description': 'Worn or fouled spark plugs can cause misfires and poor engine performance.',
            'tools_needed': ['Spark plug socket', 'Ratchet', 'Gap tool', 'Torque wrench'],
            'difficulty': 'Easy to Moderate',
            'estimated_time': '30-90 minutes (depending on engine)',
            'steps': [
                'Allow engine to cool completely',
                'Remove ignition coils or spark plug wires',
                'Remove old spark plugs using spark plug socket',
                'Check gap on new plugs and adjust if necessary',
                'Install new plugs and torque to specification',
                'Reinstall coils or wires',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Inspect/replace ignition coils',
            'description': 'Faulty ignition coils can cause misfires, especially under load or at high RPM.',
            'tools_needed': ['Basic hand tools'],
            'difficulty': 'Easy',
            'estimated_time': '30-60 minutes',
            'steps': [
                'Identify the cylinder(s) with misfire codes',
                'Disconnect electrical connector from coil',
                'Remove coil mounting bolt(s) if present',
                'Pull coil straight up from spark plug',
                'Inspect for cracks, carbon tracking, or damage',
                'Install new coil if necessary',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Check compression',
            'description': 'Low compression can cause misfires and poor engine performance.',
            'tools_needed': ['Compression gauge', 'Basic hand tools'],
            'difficulty': 'Moderate',
            'estimated_time': '60-90 minutes',
            'steps': [
                'Ensure battery is fully charged',
                'Remove all spark plugs',
                'Disable fuel and ignition systems (refer to vehicle manual)',
                'Insert compression gauge into spark plug hole',
                'Crank engine through several compression cycles',
                'Record readings for each cylinder and compare to specifications',
                'If low compression is found, further diagnosis is needed'
            ]
        }
    ],
    'Auxiliary Emissions Controls': [
        {
            'procedure': 'Check/replace EGR valve',
            'description': 'The Exhaust Gas Recirculation (EGR) valve can become clogged or stuck.',
            'tools_needed': ['Basic hand tools', 'Carburetor cleaner'],
            'difficulty': 'Moderate',
            'estimated_time': '30-60 minutes',
            'steps': [
                'Locate the EGR valve (typically on intake manifold)',
                'Disconnect electrical connector and vacuum lines',
                'Remove mounting bolts and EGR valve',
                'Inspect for carbon buildup or damage',
                'Clean or replace as necessary',
                'Reinstall with new gasket if required',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Inspect EVAP system',
            'description': 'The Evaporative Emission Control System prevents fuel vapors from escaping into the atmosphere.',
            'tools_needed': ['Smoke machine (recommended)', 'Basic hand tools'],
            'difficulty': 'Moderate to Difficult',
            'estimated_time': '60-90 minutes',
            'steps': [
                'Inspect all EVAP hoses and connections for cracks or damage',
                'Check purge valve and canister for proper operation',
                'Use a smoke machine to detect leaks in the system',
                'Replace damaged components as necessary',
                'Clear codes and test'
            ]
        }
    ],
    'Vehicle Speed Control and Idle Control': [
        {
            'procedure': 'Clean throttle body',
            'description': 'Carbon buildup in the throttle body can cause irregular idle and poor performance.',
            'tools_needed': ['Throttle body cleaner', 'Basic hand tools', 'Rags'],
            'difficulty': 'Easy',
            'estimated_time': '30 minutes',
            'steps': [
                'Locate the throttle body (between air intake and intake manifold)',
                'Disconnect air intake duct',
                'Spray throttle body cleaner on throttle plate and inside housing',
                'Use a soft brush or cloth to remove deposits',
                'Clean thoroughly but avoid getting cleaner on sensors',
                'Reassemble and clear codes',
                'Note: Some vehicles require idle relearn procedure after cleaning'
            ]
        },
        {
            'procedure': 'Check/replace idle air control valve',
            'description': 'The idle air control valve regulates airflow during idle to maintain proper RPM.',
            'tools_needed': ['Basic hand tools'],
            'difficulty': 'Moderate',
            'estimated_time': '30-45 minutes',
            'steps': [
                'Locate the idle air control valve (typically on throttle body)',
                'Disconnect electrical connector',
                'Remove mounting screws and valve',
                'Inspect for carbon buildup or damage',
                'Clean or replace as necessary',
                'Reinstall and reconnect',
                'Clear codes and test'
            ]
        }
    ],
    'Computer Output Circuit': [
        {
            'procedure': 'Check wiring and connections',
            'description': 'Damaged wiring or poor connections can cause circuit faults.',
            'tools_needed': ['Multimeter', 'Wire repair kit', 'Basic hand tools'],
            'difficulty': 'Moderate to Difficult',
            'estimated_time': '60+ minutes',
            'steps': [
                'Refer to wiring diagrams for the specific circuit',
                'Inspect wiring for damage, corrosion, or loose connections',
                'Check for proper voltage and ground at components',
                'Repair or replace damaged wiring as necessary',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Check/replace sensors',
            'description': 'Faulty sensors can cause incorrect readings and trigger check engine light.',
            'tools_needed': ['Multimeter', 'Basic hand tools'],
            'difficulty': 'Varies by sensor',
            'estimated_time': '30-60 minutes',
            'steps': [
                'Identify the specific sensor from the trouble code',
                'Disconnect electrical connector',
                'Test sensor resistance or voltage as appropriate',
                'Compare readings to specifications',
                'Replace sensor if values are out of range',
                'Clear codes and test'
            ]
        }
    ],
    'Transmission': [
        {
            'procedure': 'Check/change transmission fluid',
            'description': 'Degraded or low transmission fluid can cause shifting problems.',
            'tools_needed': ['Transmission fluid, correct type', 'Basic hand tools', 'Drain pan'],
            'difficulty': 'Moderate',
            'estimated_time': '30-60 minutes',
            'steps': [
                'Ensure vehicle is level and at operating temperature',
                'Locate transmission drain plug or pan',
                'Place drain pan underneath',
                'Remove drain plug or pan and allow fluid to drain',
                'Replace filter if accessible',
                'Reinstall drain plug or pan with new gasket',
                'Add correct type and amount of transmission fluid',
                'Check level following manufacturer procedure',
                'Clear codes and test'
            ]
        },
        {
            'procedure': 'Check/replace shift solenoids',
            'description': 'Shift solenoids control fluid flow in the transmission for gear changes.',
            'tools_needed': ['Basic hand tools', 'Transmission fluid'],
            'difficulty': 'Difficult',
            'estimated_time': '120+ minutes',
            'steps': [
                'Refer to service manual for specific solenoid location',
                'Remove transmission pan',
                'Locate and remove faulty solenoid',
                'Install new solenoid',
                'Reinstall pan with new gasket',
                'Refill with correct transmission fluid',
                'Clear codes and test'
            ]
        }
    ],
    'Vehicle Information': [
        {
            'procedure': 'Reset vehicle ECU',
            'description': 'Sometimes a simple ECU reset can resolve communication issues.',
            'tools_needed': ['Basic hand tools or OBD-II scanner'],
            'difficulty': 'Easy',
            'estimated_time': '15 minutes',
            'steps': [
                'Method 1: Disconnect negative battery terminal for 15 minutes',
                'Method 2: Use OBD-II scanner to reset ECU',
                'Reconnect battery if disconnected',
                'Start vehicle and allow systems to initialize',
                'Test for proper operation'
            ]
        }
    ],
    'Hybrid Propulsion': [
        {
            'procedure': 'Hybrid system diagnostic',
            'description': 'Hybrid system issues often require specialized knowledge and tools.',
            'tools_needed': ['Hybrid-capable scan tool', 'Insulated gloves', 'Basic hand tools'],
            'difficulty': 'Difficult',
            'estimated_time': 'Varies',
            'steps': [
                'Warning: Hybrid systems contain high voltage components',
                'Professional diagnosis is strongly recommended',
                'Do not attempt repairs without proper training and equipment',
                'Consult dealer or hybrid specialist for assistance'
            ]
        }
    ]
}

def load_dtc_database():
    """Load the DTC database from the JSON file."""
    try:
        with open(DTC_DATABASE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading DTC database: {e}")
        return None

def generate_solution_recommendations():
    """Generate solution recommendations for each DTC."""
    dtc_database = load_dtc_database()
    if not dtc_database:
        print("Failed to load DTC database.")
        return
    
    solution_database = {
        'metadata': {
            'total_codes': dtc_database['metadata']['total_codes'],
            'total_solutions': 0
        },
        'solutions': {}
    }
    
    # Process each DTC
    for dtc in dtc_database['codes']:
        code = dtc['code']
        
        # Skip if not a P code
        if not code.startswith('P'):
            continue
        
        # Determine the system category
        category_code = code[0:3]  # e.g., P00, P01, etc.
        system_category = SYSTEM_CATEGORIES.get(category_code, 'General')
        
        # Get common repairs for this category
        common_repairs = COMMON_REPAIRS.get(system_category, COMMON_REPAIRS.get('Computer Output Circuit', []))
        
        # Extract possible causes from the DTC
        possible_causes = []
        if 'possible_causes' in dtc and dtc['possible_causes']:
            if isinstance(dtc['possible_causes'], list):
                possible_causes = dtc['possible_causes']
           
(Content truncated due to size limit. Use line ranges to read in chunks)