# 13. Testing and Debugging Strategies

This section explores effective strategies for testing and debugging your React Native OBD-II application, ensuring reliable performance across different vehicles and conditions.

## Testing Environment Setup

Before deploying your application to real vehicles, it's important to set up a proper testing environment.

### OBD-II Simulator

An OBD-II simulator can be invaluable for development and testing:

1. **Hardware Simulators**:
   - ELM327 simulator devices that mimic vehicle responses
   - Can be connected via WiFi just like a real adapter
   - Allows testing without access to a vehicle

2. **Software Simulators**:
   - Virtual OBD-II servers that run on your development machine
   - Can simulate different vehicle protocols and responses
   - Useful for automated testing

### Setting Up a Software Simulator

Here's how to set up a simple OBD-II simulator for testing:

```javascript
// OBD-II Simulator Server
const net = require('net');
const readline = require('readline');

// Configuration
const PORT = 35000;
const HOST = '0.0.0.0';

// Simulated vehicle data
const vehicleData = {
  // Mode 01 PIDs
  '0100': '41 00 BE 3E B8 10', // Supported PIDs 01-20
  '0101': '41 01 00 07 E5 00', // Monitor status
  '010C': '41 0C 0F A0',       // Engine RPM (2000 RPM)
  '010D': '41 0D 37',          // Vehicle speed (55 km/h)
  '0105': '41 05 7B',          // Coolant temperature (83°C)
  '010B': '41 0B 64',          // Intake manifold pressure (100 kPa)
  '010F': '41 0F 43',          // Intake air temperature (27°C)
  '0111': '41 11 32',          // Throttle position (20%)
  
  // Mode 03 (DTCs)
  '03': '43 01 33 00 00 00 00', // One DTC: P0133
  
  // Mode 04 (Clear DTCs)
  '04': '44', // DTC clearing acknowledged
  
  // Mode 09 (Vehicle Info)
  '0902': '49 02 01 31 47 31 4A 43 35 34 34 34 52 37 32 39 35 36 37 38 39' // VIN
};

// AT command responses
const atCommands = {
  'ATZ': 'ELM327 v1.5',
  'ATE0': 'OK',
  'ATL0': 'OK',
  'ATH1': 'OK',
  'ATS0': 'OK',
  'ATSP0': 'OK',
  'ATAT1': 'OK',
  'ATST64': 'OK',
  'ATI': 'ELM327 v1.5',
  'ATDP': 'AUTO, ISO 15765-4 (CAN 11/500)',
  'ATRV': '14.2V'
};

// Create server
const server = net.createServer((socket) => {
  console.log('Client connected');
  
  // Set encoding
  socket.setEncoding('utf8');
  
  // Buffer for incoming data
  let buffer = '';
  
  // Handle data
  socket.on('data', (data) => {
    // Add to buffer
    buffer += data.toString();
    
    // Check for complete command (ends with \r or \n)
    if (buffer.includes('\r') || buffer.includes('\n')) {
      // Split commands (might be multiple)
      const commands = buffer.split(/[\r\n]/).filter(cmd => cmd.trim() !== '');
      
      // Reset buffer
      buffer = '';
      
      // Process each command
      commands.forEach(command => {
        processCommand(command.trim(), socket);
      });
    }
  });
  
  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected');
  });
  
  // Handle errors
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Process OBD command
function processCommand(command, socket) {
  console.log(`Received command: ${command}`);
  
  // Add delay to simulate real device
  setTimeout(() => {
    let response;
    
    // Check if it's an AT command
    if (command.toUpperCase().startsWith('AT')) {
      response = atCommands[command.toUpperCase()] || 'OK';
    } else {
      // Check if it's a known OBD command
      response = vehicleData[command.toUpperCase()];
      
      // If not found, return NO DATA
      if (!response) {
        response = 'NO DATA';
      }
    }
    
    // Send response
    console.log(`Sending response: ${response}`);
    socket.write(`${response}\r>`);
  }, 100); // 100ms delay
}

// Start server
server.listen(PORT, HOST, () => {
  console.log(`OBD-II simulator running on ${HOST}:${PORT}`);
  console.log('Available commands:');
  console.log('- AT commands: ATZ, ATE0, ATL0, ATH1, ATS0, ATSP0, ATAT1, ATST64, ATI, ATDP, ATRV');
  console.log('- OBD commands: 0100, 0101, 010C, 010D, 0105, 010B, 010F, 0111, 03, 04, 0902');
});

// Command line interface for dynamic updates
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Enter commands to update simulator data (e.g., "set 010C 41 0C 12 34" to change RPM)');

rl.on('line', (input) => {
  const parts = input.split(' ');
  
  if (parts[0] === 'set' && parts.length >= 3) {
    const pid = parts[1];
    const value = parts.slice(2).join(' ');
    
    vehicleData[pid] = value;
    console.log(`Updated ${pid} to "${value}"`);
  } else if (parts[0] === 'list') {
    console.log('Current vehicle data:');
    Object.entries(vehicleData).forEach(([pid, value]) => {
      console.log(`${pid}: ${value}`);
    });
  } else {
    console.log('Unknown command. Use "set [pid] [value]" or "list"');
  }
});
```

Save this code as `obd_simulator.js` and run it with Node.js:

```bash
node obd_simulator.js
```

This simulator creates a TCP server that responds to OBD-II commands just like a real ELM327 adapter. You can connect your React Native app to this simulator by configuring it to use your development machine's IP address and port 35000.

## Unit Testing

Unit tests are essential for ensuring the reliability of your OBD-II module.

### Testing the Native Module Interface

Here's how to set up unit tests for your native module interface:

```javascript
// __tests__/ObdWiFi-test.js
import ObdWiFi from '../src/ObdWiFi';

// Mock the native module
jest.mock('../src/ObdWiFi', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(),
  sendCommand: jest.fn(),
  sendPidRequest: jest.fn(),
  startContinuousMonitoring: jest.fn(),
  stopContinuousMonitoring: jest.fn(),
  initializeConnection: jest.fn(),
  readDiagnosticCodes: jest.fn(),
  clearDiagnosticCodes: jest.fn(),
  addListener: jest.fn(() => ({
    remove: jest.fn()
  }))
}));

describe('ObdWiFi Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('connect should call native method with correct parameters', async () => {
    // Setup
    ObdWiFi.connect.mockResolvedValue(true);
    
    // Execute
    const result = await ObdWiFi.connect({
      ipAddress: '192.168.0.10',
      port: 35000,
      autoConnect: true,
      connectionTimeout: 10000,
      responseTimeout: 5000,
      protocol: 0
    });
    
    // Verify
    expect(ObdWiFi.connect).toHaveBeenCalledWith({
      ipAddress: '192.168.0.10',
      port: 35000,
      autoConnect: true,
      connectionTimeout: 10000,
      responseTimeout: 5000,
      protocol: 0
    });
    expect(result).toBe(true);
  });
  
  test('sendCommand should call native method with correct parameters', async () => {
    // Setup
    ObdWiFi.sendCommand.mockResolvedValue('41 0C 0F A0');
    
    // Execute
    const result = await ObdWiFi.sendCommand('010C');
    
    // Verify
    expect(ObdWiFi.sendCommand).toHaveBeenCalledWith('010C');
    expect(result).toBe('41 0C 0F A0');
  });
  
  test('startContinuousMonitoring should call native method with correct parameters', async () => {
    // Setup
    ObdWiFi.startContinuousMonitoring.mockResolvedValue(true);
    
    const items = [
      { mode: 0x01, pid: 0x0C },
      { mode: 0x01, pid: 0x0D }
    ];
    
    // Execute
    const result = await ObdWiFi.startContinuousMonitoring(items, 1000);
    
    // Verify
    expect(ObdWiFi.startContinuousMonitoring).toHaveBeenCalledWith(items, 1000);
    expect(result).toBe(true);
  });
  
  // Add more tests for other methods
});
```

### Testing Data Processing Logic

Test your data processing logic to ensure correct interpretation of OBD-II responses:

```javascript
// __tests__/ObdDataProcessor-test.js
import { parseOBDResponse, decodeDTC } from '../src/ObdDataProcessor';

describe('OBD Data Processor', () => {
  test('parseOBDResponse should correctly parse RPM data', () => {
    // Setup
    const mode = '01';
    const pid = '0C';
    const response = '41 0C 0F A0';
    
    // Execute
    const result = parseOBDResponse(mode, pid, response);
    
    // Verify
    expect(result).toEqual({
      name: 'Engine RPM',
      value: 1000, // (0x0F * 256 + 0xA0) / 4 = 1000
      unit: 'rpm',
      rawResponse: '41 0C 0F A0'
    });
  });
  
  test('parseOBDResponse should correctly parse vehicle speed', () => {
    // Setup
    const mode = '01';
    const pid = '0D';
    const response = '41 0D 37';
    
    // Execute
    const result = parseOBDResponse(mode, pid, response);
    
    // Verify
    expect(result).toEqual({
      name: 'Vehicle Speed',
      value: 55, // 0x37 = 55
      unit: 'km/h',
      rawResponse: '41 0D 37'
    });
  });
  
  test('parseOBDResponse should correctly parse coolant temperature', () => {
    // Setup
    const mode = '01';
    const pid = '05';
    const response = '41 05 7B';
    
    // Execute
    const result = parseOBDResponse(mode, pid, response);
    
    // Verify
    expect(result).toEqual({
      name: 'Engine Coolant Temperature',
      value: 83, // 0x7B - 40 = 83
      unit: '°C',
      rawResponse: '41 05 7B'
    });
  });
  
  test('decodeDTC should correctly decode P0133', () => {
    // Setup
    const firstByte = 0x01;
    const secondByte = 0x33;
    
    // Execute
    const result = decodeDTC(firstByte, secondByte);
    
    // Verify
    expect(result).toBe('P0133');
  });
  
  // Add more tests for other data types
});
```

## Integration Testing

Integration tests verify that your module works correctly with the React Native application.

### Testing Connection Flow

Test the complete connection flow from UI to native module:

```javascript
// __tests__/ConnectionFlow-test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConnectionScreen from '../src/screens/ConnectionScreen';
import ObdWiFi from '../src/ObdWiFi';

// Mock the native module
jest.mock('../src/ObdWiFi');

describe('Connection Flow', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('should show connecting state when connect button is pressed', async () => {
    // Setup
    ObdWiFi.connect.mockResolvedValue(true);
    ObdWiFi.initializeConnection.mockResolvedValue(true);
    
    // Render component
    const { getByText, getByTestId } = render(<ConnectionScreen />);
    
    // Execute
    fireEvent.press(getByText('Connect'));
    
    // Verify
    expect(getByTestId('connecting-indicator')).toBeTruthy();
    
    // Wait for connection to complete
    await waitFor(() => {
      expect(ObdWiFi.connect).toHaveBeenCalled();
      expect(ObdWiFi.initializeConnection).toHaveBeenCalled();
    });
  });
  
  test('should show error message when connection fails', async () => {
    // Setup
    ObdWiFi.connect.mockRejectedValue(new Error('Connection failed'));
    
    // Render component
    const { getByText } = render(<ConnectionScreen />);
    
    // Execute
    fireEvent.press(getByText('Connect'));
    
    // Verify
    await waitFor(() => {
      expect(getByText(/Connection Error/)).toBeTruthy();
      expect(getByText(/Connection failed/)).toBeTruthy();
    });
  });
  
  // Add more tests for the connection flow
});
```

### Testing Data Collection

Test the data collection and display flow:

```javascript
// __tests__/DataCollection-test.js
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import DataScreen from '../src/screens/DataScreen';
import ObdWiFi from '../src/ObdWiFi';

// Mock the native module
jest.mock('../src/ObdWiFi');

describe('Data Collection', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock the addListener method
    let listener;
    ObdWiFi.addListener.mockImplementation((callback) => {
      listener = callback;
      return {
        remove: jest.fn()
      };
    });
    
    // Expose the listener for tests
    global.emitObdEvent = (event) => {
      if (listener) {
        listener(event);
      }
    };
  });
  
  test('should display vehicle data when received', async () => {
    // Setup
    ObdWiFi.isConnected.mockResolvedValue(true);
    
    // Render component
    const { getByText } = render(<DataScreen />);
    
    // Emit data event
    act(() => {
      global.emitObdEvent({
        type: 'data',
        data: {
          values: {
            '1:12': 2000, // RPM
            '1:13': 55,   // Speed
            '1:5': 83     // Coolant
          }
        }
      });
    });
    
    // Verify
    await waitFor(() => {
      expect(getByText('2000 rpm')).toBeTruthy();
      expect(getByText('55 km/h')).toBeTruthy();
      expect(getByText('83 °C')).toBeTruthy();
    });
  });
  
  test('should display DTCs when received', async () => {
    // Setup
    ObdWiFi.isConnected.mockResolvedValue(true);
    
    // Render component
    const { getByText } = render(<DataScreen />);
    
    // Emit DTC event
    act(() => {
      global.emitObdEvent({
        type: 'dtc',
        data: {
          codes: ['P0133']
        }
      });
    });
    
    // Verify
    await waitFor(() => {
      expect(getByText('P0133')).toBeTruthy();
    });
  });
  
  // Add more tests for data collection
});
```

## Debugging Strategies

Effective debugging is crucial for resolving issues in your OBD-II application.

### Native Module Debugging

For debugging native module issues:

1. **Enable Verbose Logging**:

```java
// Android: Add this to your ObdWiFiModule.java
private static final boolean DEBUG = true;

private void log(String message) {
    if (DEBUG) {
        Log.d("ObdWiFiModule", message);
    }
}

// Then use throughout your code
log("Connecting to " + ipAddress + ":" + port);
```

```swift
// iOS: Add this to your ObdWiFiModule.swift
private let debug = true

private func log(_ message: String) {
    if debug {
        NSLog("ObdWiFiModule: \(message)")
    }
}

// Then use throughout your code
log("Connecting to \(ipAddress):\(port)")
```

2. **Inspect Network Traffic**:

For WiFi adapters, you can use network analysis tools to inspect the communication:

```bash
# On your development machine
sudo tcpdump -i any port 35000 -X
```

3. **Add Debug Bridge**:

Create a debug bridge to expose internal state:

```javascript
// src/ObdWiFiDebug.js
import ObdWiFi from './ObdWiFi';

// Debug commands
const debugCommands = {
  // Get internal state
  getInternalState: async () => {
    try {
      return await ObdWiFi.sendCommand('ATDEBUG');
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
  
  // Send raw command
  sendRawCommand: async (command) => {
    try {
      return await ObdWiFi.sendCommand(command);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
  
  // Get connection details
  getConnectionDetails: async () => {
    try {
      const isConnected = await ObdWiFi.isConnected();
      
      if (!isConnected) {
        return 'Not connected';
      }
      
      const protocol = await ObdWiFi.sendCommand('ATDP');
      const voltage = await ObdWiFi.sendCommand('ATRV');
      const version = await ObdWiFi.sendCommand('ATI');
      
      return {
        protocol,
        voltage,
        version
      };
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
};

export default debugCommands;
```

### JavaScript Debugging

For debugging JavaScript issues:

1. **Add Comprehensive Logging**:

```javascript
// src/utils/logger.js
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

// Configure log level
export function setLogLevel(level) {
  currentLogLevel = level;
}

// Log functions
export function debug(message, data) {
  if (currentLogLevel <= 
(Content truncated due to size limit. Use line ranges to read in chunks)