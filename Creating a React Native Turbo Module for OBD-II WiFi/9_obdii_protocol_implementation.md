# 9. OBD-II Protocol Implementation

This section provides a detailed explanation of implementing support for all seven OBD-II protocols in your application, with specific focus on compatibility with the ZAKVOP OBD2 scanner.

## Supporting All 7 OBD-II Protocols

The ZAKVOP OBD2 scanner supports all seven OBD-II protocols, which is a significant advantage as it ensures compatibility with virtually any OBD-II compliant vehicle manufactured since 1996. Let's explore how to implement support for these protocols in your application.

### Protocol Overview

Here's a refresher on the seven protocols supported by the ZAKVOP scanner:

1. **ISO9141-2 (5 baud init, 10.4 Kbaud)**
   - Used primarily in older European and Asian vehicles
   - Slower initialization process (5 baud)
   - Communication speed of 10.4 Kbaud

2. **ISO14230-4 KWP (5 baud init, 10.4 Kbaud)**
   - Keyword Protocol 2000 with slow initialization
   - Used in various European and Asian vehicles
   - Similar to ISO9141-2 but with different message structure

3. **ISO14230-4 KWP (fast init, 10.4 Kbaud)**
   - Same as above but with faster initialization
   - Reduces connection establishment time

4. **ISO15765-4 CAN (11-bit ID, 500 Kbaud)**
   - Controller Area Network protocol with standard addressing
   - Mandatory for all US vehicles since 2008
   - High-speed communication (500 Kbaud)

5. **ISO15765-4 CAN (29-bit ID, 500 Kbaud)**
   - CAN protocol with extended addressing
   - Allows more unique message identifiers
   - Same speed as standard CAN

6. **ISO15765-4 CAN (11-bit ID, 250 Kbaud)**
   - Medium-speed CAN with standard addressing
   - Used in some vehicle subsystems

7. **ISO15765-4 CAN (29-bit ID, 250 Kbaud)**
   - Medium-speed CAN with extended addressing
   - Least common among the CAN variants

### Protocol Selection Strategy

There are two main approaches to protocol selection:

1. **Automatic Protocol Detection**:
   - Let the ELM327 chip in the ZAKVOP adapter automatically detect the protocol
   - Simplest approach and works in most cases
   - Implemented by sending the `ATSP0` command

2. **Manual Protocol Selection**:
   - Explicitly set the protocol based on vehicle information
   - May be necessary for some vehicles with communication issues
   - Implemented by sending `ATSPn` command, where n is the protocol number (1-7)

### Implementation Example

Here's how to implement protocol selection in your application:

```javascript
import ObdWiFi from 'react-native-obd-wifi';

// Protocol constants
const OBD_PROTOCOLS = {
  AUTO: 0,
  ISO9141_5BAUD: 1,
  ISO14230_5BAUD: 2,
  ISO14230_FAST: 3,
  ISO15765_11BIT_500K: 4,
  ISO15765_29BIT_500K: 5,
  ISO15765_11BIT_250K: 6,
  ISO15765_29BIT_250K: 7
};

// Protocol names for display
const PROTOCOL_NAMES = {
  0: 'Auto (Detect automatically)',
  1: 'ISO9141-2 (5 baud init, 10.4 Kbaud)',
  2: 'ISO14230-4 KWP (5 baud init, 10.4 Kbaud)',
  3: 'ISO14230-4 KWP (fast init, 10.4 Kbaud)',
  4: 'ISO15765-4 CAN (11-bit ID, 500 Kbaud)',
  5: 'ISO15765-4 CAN (29-bit ID, 500 Kbaud)',
  6: 'ISO15765-4 CAN (11-bit ID, 250 Kbaud)',
  7: 'ISO15765-4 CAN (29-bit ID, 250 Kbaud)'
};

// Function to set protocol
async function setProtocol(protocolNumber) {
  try {
    // Check if connected
    if (!(await ObdWiFi.isConnected())) {
      throw new Error('Not connected to OBD adapter');
    }
    
    // Send protocol selection command
    const command = `ATSP${protocolNumber}`;
    const success = await ObdWiFi.sendCommand(command);
    
    if (success) {
      console.log(`Protocol set to ${PROTOCOL_NAMES[protocolNumber]}`);
      
      // If auto protocol, we should try to determine which protocol was selected
      if (protocolNumber === OBD_PROTOCOLS.AUTO) {
        await determineCurrentProtocol();
      }
      
      return true;
    } else {
      console.error('Failed to set protocol');
      return false;
    }
  } catch (error) {
    console.error('Error setting protocol:', error);
    return false;
  }
}

// Function to determine current protocol
async function determineCurrentProtocol() {
  try {
    // Send command to describe protocol
    const success = await ObdWiFi.sendCommand('ATDP');
    
    // The response will be handled by the event listener
    // You would need to parse the response to determine the protocol
    
    return success;
  } catch (error) {
    console.error('Error determining protocol:', error);
    return false;
  }
}

// Example usage
async function initializeWithProtocol(useAutoDetect = true) {
  try {
    // Connect to adapter
    const connected = await ObdWiFi.connect({
      ipAddress: '192.168.0.10',
      port: 35000,
      autoConnect: true,
      connectionTimeout: 10000,
      responseTimeout: 5000,
      protocol: useAutoDetect ? OBD_PROTOCOLS.AUTO : OBD_PROTOCOLS.ISO15765_11BIT_500K // Default to CAN if not auto
    });
    
    if (connected) {
      // Initialize connection (this will set the protocol based on the connection config)
      const initialized = await ObdWiFi.initializeConnection();
      
      if (initialized) {
        console.log('OBD adapter initialized successfully');
        return true;
      } else {
        console.error('Failed to initialize OBD adapter');
        return false;
      }
    } else {
      console.error('Failed to connect to OBD adapter');
      return false;
    }
  } catch (error) {
    console.error('Error initializing with protocol:', error);
    return false;
  }
}
```

## AT Command Handling

AT commands are used to configure the ELM327 chip in the ZAKVOP adapter. Proper handling of these commands is essential for reliable communication.

### Common AT Commands

Here are the most important AT commands for working with the ZAKVOP adapter:

| Command | Description | Example Response |
|---------|-------------|------------------|
| `ATZ` | Reset all settings | `ELM327 v1.5` |
| `ATE0` | Turn echo off | `OK` |
| `ATL0` | Turn linefeeds off | `OK` |
| `ATH1` | Show headers | `OK` |
| `ATS0` | Spaces off | `OK` |
| `ATSP0` | Set protocol to auto | `OK` |
| `ATDP` | Describe protocol | `AUTO, ISO 15765-4 (CAN 11/500)` |
| `ATAT1` | Set adaptive timing to mode 1 | `OK` |
| `ATST64` | Set timeout to 100ms * 64 | `OK` |
| `ATI` | Show adapter information | `ELM327 v1.5` |

### Initialization Sequence

A proper initialization sequence is crucial for reliable communication. Here's a recommended sequence:

```javascript
async function initializeAdapter() {
  try {
    // Create an array of initialization commands
    const initCommands = [
      'ATZ',      // Reset all
      'ATE0',     // Echo off
      'ATL0',     // Linefeeds off
      'ATH1',     // Headers on
      'ATS0',     // Spaces off
      'ATSP0',    // Auto protocol
      'ATAT1',    // Adaptive timing mode 1
      'ATST64'    // Timeout 6.4 seconds
    ];
    
    // Execute commands sequentially
    for (const command of initCommands) {
      console.log(`Sending: ${command}`);
      const success = await ObdWiFi.sendCommand(command);
      
      if (!success) {
        console.error(`Failed to send command: ${command}`);
        return false;
      }
      
      // Add a small delay between commands
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Adapter initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing adapter:', error);
    return false;
  }
}
```

### Command Response Handling

AT commands typically return simple responses like "OK" or "ELM327 v1.5". These responses should be handled appropriately:

```javascript
// Set up event listener for responses
const subscription = ObdWiFi.addListener((event) => {
  if (event.type === 'data') {
    const response = event.data?.rawResponse;
    
    if (response) {
      // Handle AT command responses
      if (response.includes('ELM327')) {
        console.log('Adapter reset successful');
      } else if (response.includes('OK')) {
        console.log('Command acknowledged');
      } else if (response.startsWith('AUTO') || response.startsWith('ISO')) {
        console.log('Protocol information:', response);
        // Parse protocol information
        parseProtocolInfo(response);
      } else {
        console.log('Received response:', response);
      }
    }
  }
});

// Parse protocol information
function parseProtocolInfo(response) {
  // Example: "AUTO, ISO 15765-4 (CAN 11/500)"
  let protocol = 'Unknown';
  let protocolNumber = 0;
  
  if (response.includes('ISO 9141-2')) {
    protocol = 'ISO 9141-2';
    protocolNumber = 1;
  } else if (response.includes('ISO 14230-4') && response.includes('5 baud')) {
    protocol = 'ISO 14230-4 KWP (5 baud init)';
    protocolNumber = 2;
  } else if (response.includes('ISO 14230-4') && response.includes('fast')) {
    protocol = 'ISO 14230-4 KWP (fast init)';
    protocolNumber = 3;
  } else if (response.includes('ISO 15765-4') && response.includes('11/500')) {
    protocol = 'ISO 15765-4 CAN (11-bit, 500K)';
    protocolNumber = 4;
  } else if (response.includes('ISO 15765-4') && response.includes('29/500')) {
    protocol = 'ISO 15765-4 CAN (29-bit, 500K)';
    protocolNumber = 5;
  } else if (response.includes('ISO 15765-4') && response.includes('11/250')) {
    protocol = 'ISO 15765-4 CAN (11-bit, 250K)';
    protocolNumber = 6;
  } else if (response.includes('ISO 15765-4') && response.includes('29/250')) {
    protocol = 'ISO 15765-4 CAN (29-bit, 250K)';
    protocolNumber = 7;
  }
  
  console.log(`Detected protocol: ${protocol} (${protocolNumber})`);
  
  // Store protocol information for later use
  // You might want to update your app's state with this information
}
```

## PID Request/Response Processing

Parameter IDs (PIDs) are used to request specific data from the vehicle. Processing PID requests and responses requires understanding the OBD-II protocol format.

### PID Request Format

A PID request consists of a mode (service) and a parameter ID:

```
[Mode][PID]
```

For example:
- `0100`: Mode 01 (current data), PID 00 (supported PIDs 01-20)
- `010C`: Mode 01 (current data), PID 0C (engine RPM)
- `0902`: Mode 09 (vehicle information), PID 02 (VIN)

### Response Format

Responses vary based on the protocol, but generally follow this format:

```
[Response Mode][PID][Data Bytes]
```

Where:
- Response Mode = Mode + 40 (e.g., Mode 01 → Response 41)
- PID = Same as request
- Data Bytes = Varies based on the parameter

For example:
- Request: `010C` (engine RPM)
- Response: `41 0C 1A F8` (RPM = ((1A * 256) + F8) / 4 = 1726.5 RPM)

### Implementation Example

Here's how to implement PID request/response processing:

```javascript
// PID definitions
const PIDs = {
  ENGINE_RPM: { mode: 0x01, pid: 0x0C, name: 'Engine RPM', unit: 'rpm' },
  VEHICLE_SPEED: { mode: 0x01, pid: 0x0D, name: 'Vehicle Speed', unit: 'km/h' },
  COOLANT_TEMP: { mode: 0x01, pid: 0x05, name: 'Coolant Temperature', unit: '°C' },
  INTAKE_TEMP: { mode: 0x01, pid: 0x0F, name: 'Intake Temperature', unit: '°C' },
  MAF_RATE: { mode: 0x01, pid: 0x10, name: 'MAF Air Flow Rate', unit: 'g/s' },
  THROTTLE_POS: { mode: 0x01, pid: 0x11, name: 'Throttle Position', unit: '%' },
  OBD_STANDARD: { mode: 0x01, pid: 0x1C, name: 'OBD Standards', unit: '' },
  FUEL_LEVEL: { mode: 0x01, pid: 0x2F, name: 'Fuel Level', unit: '%' },
  DISTANCE_MIL: { mode: 0x01, pid: 0x21, name: 'Distance with MIL on', unit: 'km' },
  VIN: { mode: 0x09, pid: 0x02, name: 'Vehicle Identification Number', unit: '' }
};

// Function to request a PID
async function requestPID(pidDef) {
  try {
    // Format the command
    const mode = pidDef.mode.toString(16).padStart(2, '0').toUpperCase();
    const pid = pidDef.pid.toString(16).padStart(2, '0').toUpperCase();
    const command = `${mode}${pid}`;
    
    // Send the request
    const response = await ObdWiFi.sendPidRequest(pidDef.mode, pidDef.pid);
    
    // Parse the response
    const parsedValue = parsePIDResponse(pidDef, response);
    
    return {
      name: pidDef.name,
      value: parsedValue,
      unit: pidDef.unit,
      rawResponse: response
    };
  } catch (error) {
    console.error(`Error requesting PID ${pidDef.name}:`, error);
    return {
      name: pidDef.name,
      value: null,
      unit: pidDef.unit,
      error: error.message
    };
  }
}

// Function to parse PID responses
function parsePIDResponse(pidDef, response) {
  if (!response) return null;
  
  // Split response into parts
  const parts = response.split(' ');
  
  // Check if response is valid
  const expectedMode = (pidDef.mode + 0x40).toString(16).toUpperCase();
  const expectedPid = pidDef.pid.toString(16).padStart(2, '0').toUpperCase();
  
  if (parts.length < 3 || parts[0] !== expectedMode || parts[1] !== expectedPid) {
    console.warn('Invalid response format:', response);
    return null;
  }
  
  // Parse based on PID
  switch (pidDef.mode) {
    case 0x01: // Current data
      switch (pidDef.pid) {
        case 0x0C: // Engine RPM
          if (parts.length >= 4) {
            const a = parseInt(parts[2], 16);
            const b = parseInt(parts[3], 16);
            return ((a * 256) + b) / 4;
          }
          break;
          
        case 0x0D: // Vehicle speed
          if (parts.length >= 3) {
            return parseInt(parts[2], 16);
          }
          break;
          
        case 0x05: // Coolant temperature
        case 0x0F: // Intake temperature
          if (parts.length >= 3) {
            return parseInt(parts[2], 16) - 40;
          }
          break;
          
        case 0x10: // MAF air flow rate
          if (parts.length >= 4) {
            const a = parseInt(parts[2], 16);
            const b = parseInt(parts[3], 16);
            return ((a * 256) + b) / 100;
          }
          break;
          
        case 0x11: // Throttle position
        case 0x2F: // Fuel level
          if (parts.length >= 3) {
            return (parseInt(parts[2], 16) * 100) / 255;
          }
          break;
          
        case 0x1C: // OBD standards
          if (parts.length >= 3) {
            const standard = parseInt(parts[2], 16);
            const standards = [
              'OBD-II (California ARB)',
              'OBD (Federal EPA)',
              'OBD and OBD-II',
              'OBD-I',
              'Not OBD compliant',
              'EOBD (Europe)',
              'JOBD (Japan)',
              'JOBD and EOBD',
              'JOBD and OBD-II',
              'JOBD, EOBD, and OBD-II',
              'EOBD and OBD-II'
            ];
            return standard <= standards.length ? standards[standard - 1] : 'Unknown';
          }
          break;
          
        case 0x21: // Distance with MIL on
          if (parts.length >= 4) {
            const a = parseInt(parts[2], 16);
            const b = parseInt(parts[3], 16);
            return (a * 256) + b;
          }
          break;
      }
      break;
      
    case 0x09: // Vehicle information
      switch (pidDef.pid) {
        case 0x02: // VIN
          // VIN parsing is more complex as it spans multiple lines
          // This is a simplified example
          let vinHex = '';
          const lines = response.split('\r');
          
          for (const line of lines) {
            if (line.startsWith('49 02')) {
              const parts = line.split(' ');
              // Skip the first 3 parts (49 02 01)
              for (let i = 3; i < parts.length; i++) {
                vinHex += parts[i];
              }
            }
          }
          
          // Convert hex to ASCII
          let vin = '';
          for (let i = 0; i < vinHex.length; i += 2) {
            const hexByte = vinHex.substr(i, 2);
            const byte = parseInt(hexByte, 16);
            vin += String.fromCharCode(byte);
          }
          
          return vin;
      }
      break;
  }
  
  return null;
}

// Example usage
async function getVehicleData() {
  try {
    // Get engine RPM
    const rpm = awa
(Content truncated due to size limit. Use line ranges to read in chunks)