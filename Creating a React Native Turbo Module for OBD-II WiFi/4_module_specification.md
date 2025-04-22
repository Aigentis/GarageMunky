# 4. Module Specification (TypeScript)

This section defines the TypeScript interface for our OBD-II WiFi module, which serves as the foundation for the Codegen process and ensures consistency between JavaScript and native code.

## Defining the Module Interface

Let's create a TypeScript specification file that defines our module's interface. This file will be used by React Native's Codegen to generate native interface files for both Android and iOS.

```typescript
// src/native/NativeObdWiFi.ts

import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

// Define the structure for connection configuration
export interface ObdConnectionConfig {
  ipAddress: string;
  port: number;
  autoConnect: boolean;
  connectionTimeout: number; // in milliseconds
  responseTimeout: number; // in milliseconds
  protocol?: number; // 0 = auto, 1-7 = specific protocol
}

// Define the structure for OBD-II data events
export interface ObdDataEvent {
  timestamp: number;
  type: 'data' | 'error' | 'status' | 'connection' | 'log';
  message: string; // Raw data string, error message, status update, or log
  data?: {
    mode?: number;
    pid?: number;
    rawResponse?: string;
    parsedValue?: number | string | boolean | null;
    unit?: string;
  };
}

// Define the structure for diagnostic trouble codes
export interface ObdDiagnosticCode {
  code: string; // e.g., "P0123"
  description: string;
  severity: 'low' | 'medium' | 'high' | 'unknown';
}

// Define the interface for our Turbo Module
export interface Spec extends TurboModule {
  // --- Connection Methods ---

  /**
   * Configure and connect to the OBD-II WiFi adapter.
   * @param config Connection configuration
   * @returns Promise resolving to true on successful connection, false otherwise
   */
  connect(config: ObdConnectionConfig): Promise<boolean>;

  /**
   * Disconnect from the currently connected adapter.
   * @returns Promise resolving to true if disconnection was successful, false otherwise
   */
  disconnect(): Promise<boolean>;

  /**
   * Check if currently connected to an OBD-II adapter.
   * @returns Promise resolving to true if connected, false otherwise
   */
  isConnected(): Promise<boolean>;

  /**
   * Get the current connection status details.
   * @returns Promise resolving to an object with connection details
   */
  getConnectionStatus(): Promise<{
    connected: boolean;
    ipAddress?: string;
    port?: number;
    protocol?: number;
    protocolName?: string;
    elapsedTimeMs?: number;
  }>;

  // --- Command Methods ---

  /**
   * Send a raw command string to the connected adapter.
   * @param command Command string (without CR termination, it will be added automatically)
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving to true if the command was sent successfully
   */
  sendCommand(command: string, timeoutMs?: number): Promise<boolean>;

  /**
   * Send an OBD-II PID request.
   * @param mode OBD-II mode (e.g., 01 for current data, 03 for DTCs)
   * @param pid OBD-II PID (e.g., 0C for RPM) - can be null for modes that don't require a PID
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving to the raw response string
   */
  sendPidRequest(mode: number, pid: number | null, timeoutMs?: number): Promise<string>;

  // --- Diagnostic Methods ---

  /**
   * Initialize the OBD-II connection with standard setup commands.
   * This typically sends commands like ATZ, ATE0, ATL0, etc.
   * @returns Promise resolving to true if initialization was successful
   */
  initializeConnection(): Promise<boolean>;

  /**
   * Read diagnostic trouble codes (DTCs) from the vehicle.
   * @returns Promise resolving to an array of diagnostic codes
   */
  readDiagnosticCodes(): Promise<ObdDiagnosticCode[]>;

  /**
   * Clear diagnostic trouble codes and turn off the MIL (Malfunction Indicator Lamp).
   * @returns Promise resolving to true if codes were cleared successfully
   */
  clearDiagnosticCodes(): Promise<boolean>;

  /**
   * Check if the vehicle is ready for emissions testing.
   * @returns Promise resolving to an object with readiness status
   */
  getEmissionsReadiness(): Promise<{
    ready: boolean;
    incompleteTests: string[];
  }>;

  // --- Data Retrieval Methods ---

  /**
   * Get the current engine RPM.
   * @returns Promise resolving to the current RPM value or null if unavailable
   */
  getEngineRPM(): Promise<number | null>;

  /**
   * Get the vehicle speed in km/h.
   * @returns Promise resolving to the current speed or null if unavailable
   */
  getVehicleSpeed(): Promise<number | null>;

  /**
   * Get the engine coolant temperature in Celsius.
   * @returns Promise resolving to the current temperature or null if unavailable
   */
  getCoolantTemperature(): Promise<number | null>;

  /**
   * Get multiple sensor values in a single call to reduce communication overhead.
   * @param items Array of sensor items to retrieve (mode and PID pairs)
   * @returns Promise resolving to an object with the requested values
   */
  getMultipleSensorValues(items: Array<{ mode: number; pid: number }>): Promise<{
    [key: string]: number | string | null;
  }>;

  // --- Continuous Monitoring ---

  /**
   * Start continuous monitoring of specified parameters.
   * @param items Array of parameters to monitor (mode and PID pairs)
   * @param intervalMs Polling interval in milliseconds
   * @returns Promise resolving to true if monitoring started successfully
   */
  startContinuousMonitoring(
    items: Array<{ mode: number; pid: number }>,
    intervalMs: number
  ): Promise<boolean>;

  /**
   * Stop continuous monitoring.
   * @returns Promise resolving to true if monitoring was stopped successfully
   */
  stopContinuousMonitoring(): Promise<boolean>;

  // --- Vehicle Information ---

  /**
   * Get vehicle identification number (VIN).
   * @returns Promise resolving to the VIN string or null if unavailable
   */
  getVehicleVIN(): Promise<string | null>;

  /**
   * Get supported PIDs for a specific mode.
   * @param mode OBD-II mode (typically 01 for current data)
   * @returns Promise resolving to an array of supported PIDs
   */
  getSupportedPIDs(mode: number): Promise<number[]>;

  // --- Event Handling ---

  /**
   * Add a listener for OBD-II events.
   * @param eventName Event name to listen for
   */
  addListener(eventName: string): void;

  /**
   * Remove listeners for OBD-II events.
   * @param count Number of listeners to remove
   */
  removeListeners(count: number): void;
}

// Register the Turbo Module
export default TurboModuleRegistry.get<Spec>('RTNObdWiFi') as Spec | null;
```

## Data Structures for OBD-II Communication

Our specification defines several key data structures:

### 1. ObdConnectionConfig

This interface defines the configuration for connecting to an OBD-II adapter:

```typescript
export interface ObdConnectionConfig {
  ipAddress: string;
  port: number;
  autoConnect: boolean;
  connectionTimeout: number; // in milliseconds
  responseTimeout: number; // in milliseconds
  protocol?: number; // 0 = auto, 1-7 = specific protocol
}
```

- `ipAddress` and `port`: Network coordinates for the WiFi adapter
- `autoConnect`: Whether to automatically reconnect if the connection is lost
- `connectionTimeout`: Maximum time to wait for connection establishment
- `responseTimeout`: Maximum time to wait for command responses
- `protocol`: Optional protocol selection (0 for auto-detection, 1-7 for specific protocols)

### 2. ObdDataEvent

This interface defines the structure of events emitted by the module:

```typescript
export interface ObdDataEvent {
  timestamp: number;
  type: 'data' | 'error' | 'status' | 'connection' | 'log';
  message: string; // Raw data string, error message, status update, or log
  data?: {
    mode?: number;
    pid?: number;
    rawResponse?: string;
    parsedValue?: number | string | boolean | null;
    unit?: string;
  };
}
```

- `timestamp`: When the event occurred
- `type`: Category of event (data, error, status, connection, log)
- `message`: Human-readable description
- `data`: Optional structured data for programmatic processing

### 3. ObdDiagnosticCode

This interface defines the structure for diagnostic trouble codes:

```typescript
export interface ObdDiagnosticCode {
  code: string; // e.g., "P0123"
  description: string;
  severity: 'low' | 'medium' | 'high' | 'unknown';
}
```

- `code`: The standardized DTC code (e.g., "P0123")
- `description`: Human-readable description of the issue
- `severity`: Categorization of the issue's severity

## Event Handling for Asynchronous Data

OBD-II communication is inherently asynchronous, with responses arriving at unpredictable times. Our module uses the standard React Native event emitter pattern:

1. **Event Registration**:
   ```typescript
   addListener(eventName: string): void;
   removeListeners(count: number): void;
   ```

2. **Event Types**:
   - `data`: Vehicle data received from the adapter
   - `error`: Communication or protocol errors
   - `status`: Module status updates
   - `connection`: Connection state changes
   - `log`: Debugging information

3. **Event Flow**:
   - Native code emits events when data is received or status changes
   - JavaScript code registers listeners to receive these events
   - Events include both raw data and parsed information when available

4. **Continuous Monitoring**:
   - The `startContinuousMonitoring` method sets up polling for specified parameters
   - Events are emitted at the specified interval with the latest values
   - The `stopContinuousMonitoring` method halts this process

## Error Handling Strategies

Our module implements comprehensive error handling:

### 1. Promise-Based Error Handling

All asynchronous methods return Promises that can reject with specific error information:

```typescript
try {
  const connected = await obdModule.connect(config);
  if (!connected) {
    // Handle connection failure
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Connection error:', error);
}
```

### 2. Error Events

Critical errors that occur outside of method calls (e.g., unexpected disconnection) are communicated via error events:

```typescript
obdModule.addListener('ObdWiFiEvent');
// In your event handler:
if (event.type === 'error') {
  // Handle error based on event.message
}
```

### 3. Error Categories

Our implementation categorizes errors for better handling:

- **Connection Errors**: Issues with WiFi connection or socket operations
- **Protocol Errors**: Issues with OBD-II protocol communication
- **Command Errors**: Invalid commands or unexpected responses
- **Timeout Errors**: Commands that exceed the specified timeout
- **Vehicle Errors**: Issues reported by the vehicle (separate from DTCs)

### 4. Recovery Strategies

The module implements automatic recovery for certain error conditions:

- **Connection Loss**: Automatic reconnection attempts if `autoConnect` is enabled
- **Protocol Errors**: Automatic protocol reset and reinitialization
- **Timeouts**: Configurable retry logic for intermittent issues

In the next section, we'll configure Codegen to process this specification and generate the necessary native interface files.
