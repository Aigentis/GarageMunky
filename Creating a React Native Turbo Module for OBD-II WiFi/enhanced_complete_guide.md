# 10. Error Handling Strategies

This section explores comprehensive error handling strategies for robust OBD-II communication, focusing on different types of errors and how to handle them effectively.

## Connection Errors

Connection errors occur when the application fails to establish or maintain a connection with the OBD-II adapter.

### Common Connection Errors

1. **Socket Connection Failures**:
   - Unable to connect to adapter's IP address and port
   - Connection timeout
   - Connection refused
   - Network unreachable

2. **WiFi Connection Issues**:
   - Device not connected to adapter's WiFi network
   - Weak signal strength
   - WiFi disconnection during operation

3. **Adapter Power Issues**:
   - Adapter not receiving power from vehicle
   - Adapter reset during operation
   - Adapter hardware failure

### Handling Connection Errors

```javascript
// Connection error handler
function handleConnectionError(error, errorType) {
  // Log the error
  console.error(`Connection error (${errorType}):`, error);
  
  // Update application state
  updateConnectionState('error', error.message);
  
  // Determine error type and provide specific guidance
  let errorMessage = 'Failed to connect to the OBD adapter.';
  let recoverySteps = [];
  
  switch (errorType) {
    case 'SOCKET_ERROR':
      errorMessage = 'Failed to establish socket connection to the OBD adapter.';
      recoverySteps = [
        'Ensure your device is connected to the adapter\'s WiFi network',
        'Verify the adapter is powered on (check for LED indicators)',
        'Try restarting the adapter by unplugging it and plugging it back in',
        'Check that no other device is currently connected to the adapter'
      ];
      break;
      
    case 'WIFI_ERROR':
      errorMessage = 'WiFi connection to the OBD adapter is unavailable.';
      recoverySteps = [
        'Connect your device to the adapter\'s WiFi network',
        'Move closer to the adapter to improve signal strength',
        'Restart your device\'s WiFi',
        'Ensure the adapter is powered on'
      ];
      break;
      
    case 'POWER_ERROR':
      errorMessage = 'The OBD adapter appears to be unpowered or malfunctioning.';
      recoverySteps = [
        'Check that the adapter is firmly plugged into the OBD-II port',
        'Ensure your vehicle\'s ignition is on',
        'Try the adapter in a different vehicle if possible',
        'Check for visible damage to the adapter'
      ];
      break;
      
    case 'TIMEOUT_ERROR':
      errorMessage = 'Connection attempt timed out.';
      recoverySteps = [
        'Ensure the adapter is powered on',
        'Check that your device is connected to the adapter\'s WiFi',
        'Try moving closer to the adapter',
        'Restart the adapter and try again'
      ];
      break;
      
    default:
      recoverySteps = [
        'Check that the adapter is properly connected to your vehicle',
        'Ensure your device is connected to the adapter\'s WiFi network',
        'Restart the adapter and try again',
        'Restart the application'
      ];
  }
  
  // Display error to user with recovery steps
  showErrorAlert(errorMessage, recoverySteps);
  
  // Attempt automatic recovery if appropriate
  if (shouldAttemptAutoRecovery(errorType)) {
    startAutoRecovery(errorType);
  }
  
  // Return false to indicate error was not resolved
  return false;
}

// Function to display error alert with recovery steps
function showErrorAlert(message, steps) {
  let fullMessage = message + '\n\nTry the following:\n';
  steps.forEach((step, index) => {
    fullMessage += `${index + 1}. ${step}\n`;
  });
  
  Alert.alert(
    'Connection Error',
    fullMessage,
    [
      { text: 'Troubleshooting Guide', onPress: showTroubleshootingGuide },
      { text: 'Try Again', onPress: retryConnection },
      { text: 'OK', style: 'cancel' }
    ]
  );
}

// Function to determine if auto recovery should be attempted
function shouldAttemptAutoRecovery(errorType) {
  // Auto recovery is appropriate for some error types
  return ['TIMEOUT_ERROR', 'WIFI_ERROR'].includes(errorType);
}

// Function to start automatic recovery
function startAutoRecovery(errorType) {
  console.log(`Starting auto recovery for ${errorType}`);
  
  // Implement recovery strategy based on error type
  switch (errorType) {
    case 'TIMEOUT_ERROR':
      // For timeouts, simply retry with longer timeout
      setTimeout(() => {
        console.log('Auto-retrying connection with longer timeout');
        connectToAdapter({ ...lastConnectionConfig, connectionTimeout: 20000 });
      }, 5000);
      break;
      
    case 'WIFI_ERROR':
      // For WiFi errors, check WiFi status periodically
      const wifiCheckInterval = setInterval(async () => {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected && netInfo.type === 'wifi') {
          console.log('WiFi reconnected, attempting adapter connection');
          clearInterval(wifiCheckInterval);
          connectToAdapter(lastConnectionConfig);
        }
      }, 5000);
      
      // Clear interval after 60 seconds to avoid infinite checking
      setTimeout(() => {
        clearInterval(wifiCheckInterval);
      }, 60000);
      break;
  }
}
```

## Command Errors

Command errors occur when the application successfully connects to the adapter but encounters issues when sending commands or receiving responses.

### Common Command Errors

1. **Invalid Command Format**:
   - Syntax errors in commands
   - Unsupported commands for the adapter
   - Incorrect parameter values

2. **Response Timeout**:
   - Adapter doesn't respond within expected time
   - Vehicle ECU doesn't respond to adapter
   - Response lost during transmission

3. **Unexpected Responses**:
   - "NO DATA" response from adapter
   - "ERROR" response from adapter
   - Incomplete or corrupted responses

### Handling Command Errors

```javascript
// Command error handler
async function handleCommandError(command, error, errorType) {
  // Log the error
  console.error(`Command error for "${command}" (${errorType}):`, error);
  
  // Determine error type and handle accordingly
  switch (errorType) {
    case 'INVALID_COMMAND':
      console.warn(`Invalid command format: ${command}`);
      // No retry for invalid commands - fix the command instead
      return false;
      
    case 'TIMEOUT':
      console.warn(`Command timeout: ${command}`);
      // For timeouts, we can retry with longer timeout
      return await retryCommandWithLongerTimeout(command);
      
    case 'NO_DATA':
      console.warn(`No data for command: ${command}`);
      // "NO DATA" might mean the vehicle doesn't support this parameter
      // or the engine is off for some parameters
      return false;
      
    case 'ADAPTER_ERROR':
      console.warn(`Adapter error for command: ${command}`);
      // Adapter errors might require reinitialization
      return await reinitializeAndRetry(command);
      
    case 'BUFFER_OVERFLOW':
      console.warn(`Buffer overflow for command: ${command}`);
      // For buffer overflow, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await retryCommand(command);
      
    default:
      console.warn(`Unknown command error for: ${command}`);
      // For unknown errors, try once more
      return await retryCommand(command);
  }
}

// Function to retry command with longer timeout
async function retryCommandWithLongerTimeout(command) {
  console.log(`Retrying command with longer timeout: ${command}`);
  try {
    // Double the timeout for retry
    const response = await ObdWiFi.sendCommand(command, defaultTimeout * 2);
    return response;
  } catch (error) {
    console.error('Retry with longer timeout failed:', error);
    return false;
  }
}

// Function to reinitialize adapter and retry command
async function reinitializeAndRetry(command) {
  console.log('Reinitializing adapter...');
  try {
    // Reinitialize the adapter
    const initialized = await ObdWiFi.initializeConnection();
    
    if (initialized) {
      console.log('Reinitialization successful, retrying command');
      // Retry the command
      return await retryCommand(command);
    } else {
      console.error('Reinitialization failed');
      return false;
    }
  } catch (error) {
    console.error('Reinitialization error:', error);
    return false;
  }
}

// Function to retry a command
async function retryCommand(command) {
  console.log(`Retrying command: ${command}`);
  try {
    // Simple retry with same parameters
    const response = await ObdWiFi.sendCommand(command);
    return response;
  } catch (error) {
    console.error('Command retry failed:', error);
    return false;
  }
}

// Function to handle specific adapter responses
function handleAdapterResponse(response) {
  if (response.includes('NO DATA')) {
    // "NO DATA" means the vehicle doesn't support this parameter
    // or the engine might be off for some parameters
    return { success: false, errorType: 'NO_DATA' };
  } else if (response.includes('ERROR')) {
    // General adapter error
    if (response.includes('BUFFER FULL')) {
      return { success: false, errorType: 'BUFFER_OVERFLOW' };
    } else if (response.includes('UNABLE TO CONNECT')) {
      return { success: false, errorType: 'VEHICLE_CONNECTION' };
    } else {
      return { success: false, errorType: 'ADAPTER_ERROR' };
    }
  } else if (response.includes('?')) {
    // Unknown command
    return { success: false, errorType: 'INVALID_COMMAND' };
  } else {
    // Successful response
    return { success: true, data: response };
  }
}
```

## Protocol Errors

Protocol errors occur when there are issues with the OBD-II protocol communication between the adapter and the vehicle.

### Common Protocol Errors

1. **Protocol Initialization Failures**:
   - Unable to determine vehicle protocol
   - Protocol initialization timeout
   - Unsupported protocol variant

2. **Protocol Communication Issues**:
   - Bus initialization errors
   - CAN message format errors
   - Checksum errors

3. **Vehicle Compatibility Issues**:
   - Vehicle uses non-standard protocol implementation
   - Manufacturer-specific extensions
   - Regional variations in protocol implementation

### Handling Protocol Errors

```javascript
// Protocol error handler
async function handleProtocolError(error, errorType) {
  // Log the error
  console.error(`Protocol error (${errorType}):`, error);
  
  // Update application state
  updateConnectionState('protocol_error', error.message);
  
  // Determine error type and handle accordingly
  switch (errorType) {
    case 'PROTOCOL_DETECTION':
      console.warn('Protocol detection failed');
      // Try manual protocol selection
      return await tryManualProtocolSelection();
      
    case 'PROTOCOL_INIT':
      console.warn('Protocol initialization failed');
      // Try reinitializing with different settings
      return await reinitializeWithDifferentSettings();
      
    case 'BUS_INIT':
      console.warn('Bus initialization failed');
      // Bus initialization errors often require adapter reset
      return await resetAdapterAndRetry();
      
    case 'CHECKSUM':
      console.warn('Checksum error in protocol communication');
      // Checksum errors might be transient, retry
      return await retryLastOperation();
      
    case 'UNSUPPORTED_PROTOCOL':
      console.warn('Vehicle may use unsupported protocol');
      // Show guidance for unsupported protocols
      showUnsupportedProtocolGuidance();
      return false;
      
    default:
      console.warn('Unknown protocol error');
      // For unknown errors, try adapter reset
      return await resetAdapterAndRetry();
  }
}

// Function to try manual protocol selection
async function tryManualProtocolSelection() {
  console.log('Attempting manual protocol selection');
  
  // Array of protocols to try (in order of likelihood)
  const protocols = [
    { number: 4, name: 'ISO 15765-4 CAN (11-bit, 500K)' }, // Most common in modern vehicles
    { number: 5, name: 'ISO 15765-4 CAN (29-bit, 500K)' },
    { number: 1, name: 'ISO 9141-2 (5 baud init)' },
    { number: 3, name: 'ISO 14230-4 KWP (fast init)' },
    { number: 2, name: 'ISO 14230-4 KWP (5 baud init)' },
    { number: 6, name: 'ISO 15765-4 CAN (11-bit, 250K)' },
    { number: 7, name: 'ISO 15765-4 CAN (29-bit, 250K)' }
  ];
  
  // Try each protocol
  for (const protocol of protocols) {
    console.log(`Trying protocol ${protocol.number}: ${protocol.name}`);
    
    try {
      // Disconnect first
      await ObdWiFi.disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Connect with specific protocol
      const connected = await ObdWiFi.connect({
        ipAddress: lastConnectionConfig.ipAddress,
        port: lastConnectionConfig.port,
        autoConnect: lastConnectionConfig.autoConnect,
        connectionTimeout: lastConnectionConfig.connectionTimeout,
        responseTimeout: lastConnectionConfig.responseTimeout,
        protocol: protocol.number // Specify protocol
      });
      
      if (connected) {
        // Initialize connection
        const initialized = await ObdWiFi.initializeConnection();
        
        if (initialized) {
          // Test communication with a simple command
          const response = await ObdWiFi.sendCommand('0100');
          
          if (response) {
            console.log(`Successfully connected using protocol ${protocol.number}`);
            // Update last known good protocol
            saveLastKnownGoodProtocol(protocol.number);
            return true;
          }
        }
      }
    } catch (error) {
      console.error(`Error trying protocol ${protocol.number}:`, error);
    }
    
    // Wait before trying next protocol
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('All protocol attempts failed');
  return false;
}

// Function to reinitialize with different settings
async function reinitializeWithDifferentSettings() {
  console.log('Reinitializing with different settings');
  
  try {
    // Try with different initialization commands
    const initCommands = [
      // Standard initialization
      ['ATZ', 'ATE0', 'ATL0', 'ATH1', 'ATS0', 'ATSP0'],
      
      // Alternative initialization with slower timing
      ['ATZ', 'ATE0', 'ATL0', 'ATH1', 'ATS0', 'ATSP0', 'ATAT2', 'ATST96'],
      
      // Initialization with specific protocol settings
      ['ATZ', 'ATE0', 'ATL0', 'ATH1', 'ATS0', 'ATSP4', 'ATCAF0'] // Try CAN 11-bit 500K without flow control
    ];
    
    // Try each initialization sequence
    for (const commands of initCommands) {
      console.log('Trying initialization sequence:', commands);
      
      try {
        // Reset adapter
        await ObdWiFi.sendCommand('ATZ');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send initialization commands
        let allSuccessful = true;
        for (const command of commands) {
          const success = await ObdWiFi.sendCommand(command);
          if (!success) {
            allSuccessful = false;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (allSuccessful) {
          // Test communication
          const response = await ObdWiFi.sendCommand('0100');
          
          if (response) {
            console.log('Reinitialization successful');
            return true;
          }
        }
      } catch (error) {
        console.error('Error during reinitialization:', error);
      }
      
      // Wait before trying next sequence
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.error('All reinitialization attempts failed');
    return false;
  } catch (error) {
    console.error('Reinitialization error:', error);
    return false;
  }
}

// Function to reset adapter and retry
async function resetAdapterAndRetry() {
  console.log('Resetting adapter');
  
  try {
    // Send reset command
    await ObdWiFi.sendCommand('ATZ');
    
    // Wait for adapter to reset
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reinitialize
    const initialized = await ObdWiFi.initializeConnection();
    
    if (initialized) {
      console.log('Adapter reset successful');
      return true;
    } else {
      console.error('Adapter reset failed');
      return false;
    }
  } catch (error) {
    console.error('Adapter reset error:', error);
    return false;
  }
}

// Function to show guidance for unsupported protocols
function showUnsupportedProtocolGuidance() {
  Alert.alert(
    'Unsupported Protocol',
    'Your vehicle may be using a protocol that is not fully supported by the adapter. This can happen with some newer vehicles or vehicles with non-standard implementations.\n\n' +
    'Suggestions:\n' +
    '1. Try a different OBD-II adapter if available\n' +
    '2. Check if your vehicle has manufacturer-specific diagnostic software\n' +
    '3. Some functions may still work - try accessing basic parameters',
    [{ text: 'OK' }]
  );
}
```

## Timeout Handling

Timeout handling is crucial for responsive and reliable OBD-II communication.

### Timeout Strategies

1. **Adaptive Timeouts**:
   - Adjust timeout values based on command complexity
   - Increase timeouts for slow-responding parameters
   - Implement progressive timeouts for retries

2. **Command Prioritization**:
   - Prioritize critical commands during high latency
   - Defer non-essential commands when timeouts occur
   - Implement command queuing with priority levels

3. **Background vs. Foreground Timeouts**:
   - Use longer timeouts for background operations
   - Use shorter timeouts for user-initiated actions
   - Provide feedback during potentially long operations

### Implementation Example

```javascript
// Timeout manager
class TimeoutManager {
  constructor() {
    // Base timeout values (milliseconds)
    this.baseTimeouts = {
      simple: 2000,      // Simple AT commands
      standard: 5000,    // Standard OBD-II commands
      complex: 10000,    // Complex or slow-responding commands
      critical: 15000    // Critical operations (e.g., DTC clear)
    };
    
    // Timeout multipliers for retries
    this.retryMultiplier = 1.5;
    
    // Maximum retry count
    this.maxRetries = 3;
    
    // Command categories
    this.commandCategories = {
      // AT commands
      'AT': 'simple',
      'ATZ': 'simple',
      'ATE': 'simple',
      'ATL': 'simple',
      'ATH': 'simple',
      'ATS': 'simple',
      'ATSP': 'simple',
      'ATAT': 'simple',
      'ATST': 'simple',
      
      // Mode 01 (current data)
      '0100': 'standard', // Supported PIDs
      '0101': 'standard', // Monitor status
      '010C': 'standard', // Engine RPM
      '010D': 'standard', // Vehicle speed
      '0105': 'standard', // Coolant temperature
      '010F': 'standard', // Intake temperature
      '0110': 'standard', // MAF air flow rate
      '0111': 'standard', // Throttle position
      
      // Mode 03 (DTCs)
      '03': 'complex',    // Get DTCs
      
      // Mode 04 (Clear DTCs)
      '04': 'critical',   // Clear DTCs
      
      // Mode 09 (Vehicle info)
      '0902': 'complex'   // VIN
    };
    
    // Adaptive timeout history
    this.timeoutHistory = {};
  }
  
  // Get timeout for a command
  getTimeout(command, retry = 0) {
    // Determine command category
    let category = 'standard'; // Default
    
    // Check for exact match
    if (this.commandCategories[command]) {
      category = this.commandCategories[command];
    } else {
      // Check for prefix match
      for (const prefix in this.commandCategories) {
        if (command.startsWith(prefix)) {
          category = this.commandCategories[prefix];
          break;
        }
      }
    }
    
    // Get base timeout for category
    let timeout = this.baseTimeouts[category];
    
    // Apply retry multiplier if this is a retry
    if (retry > 0) {
      timeout = timeout * Math.pow(this.retryMultiplier, retry);
    }
    
    // Apply adaptive adjustment if we have history
    if (this.timeoutHistory[command]) {
      const history = this.timeoutHistory[command];
      
      // If we've had timeouts for this command before, increase the timeout
      if (history.timeouts > 0) {
        const adaptiveMultiplier = 1 + (history.timeouts / (history.successes + 1));
        timeout = timeout * adaptiveMultiplier;
      }
    }
    
    return Math.min(timeout, 30000); // Cap at 30 seconds
  }
  
  // Record command result for adaptive timeouts
  recordCommandResult(command, success) {
    if (!this.timeoutHistory[command]) {
      this.timeoutHistory[command] = {
        successes: 0,
        timeouts: 0
      };
    }
    
    if (success) {
      this.timeoutHistory[command].successes++;
    } else {
      this.timeoutHistory[command].timeouts++;
    }
  }
  
  // Execute command with timeout handling
  async executeCommand(command, executeFunc) {
    let retry = 0;
    
    while (retry <= this.maxRetries) {
      const timeout = this.getTimeout(command, retry);
      
      try {
        console.log(`Executing command ${command} with timeout ${timeout}ms (retry ${retry})`);
        
        // Execute the command with timeout
        const result = await Promise.race([
          executeFunc(timeout),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
        
        // Record success
        this.recordCommandResult(command, true);
        
        return result;
      } catch (error) {
        if (error.message === 'Timeout') {
          console.warn(`Command ${command} timed out after ${timeout}ms`);
          
          // Record timeout
          this.recordCommandResult(command, false);
          
          // Increment retry counter
          retry++;
          
          if (retry > this.maxRetries) {
            console.error(`Maximum retries (${this.maxRetries}) exceeded for command ${command}`);
            throw new Error(`Command timed out after ${this.maxRetries} retries`);
          }
        } else {
          // Not a timeout error, rethrow
          throw error;
        }
      }
    }
  }
}

// Example usage
const timeoutManager = new TimeoutManager();

async function executeObdCommand(command) {
  return await timeoutManager.executeCommand(command, async (timeout) => {
    // Pass timeout to the OBD command
    return await ObdWiFi.sendCommand(command, timeout);
  });
}
```

By implementing these error handling strategies, your application will be more robust and provide a better user experience, especially in challenging environments where communication issues are common.

In the next section, we'll explore the implementation of the AI diagnostic assistant that will leverage the OBD-II data to provide intelligent vehicle diagnostics.
# 11. AI Diagnostic Assistant Implementation

This section explores how to implement an AI-powered diagnostic assistant that leverages the OBD-II data collected through our WiFi module to help diagnose vehicle issues.

## Architecture Overview

The AI diagnostic assistant consists of several interconnected components that work together to collect, analyze, and interpret vehicle data:

### 1. Data Collection Layer

This layer interfaces directly with the OBD-II module to collect raw data from the vehicle:

- **Real-time Data Collection**: Continuously monitors key vehicle parameters
- **DTC Retrieval**: Reads diagnostic trouble codes when present
- **Freeze Frame Data**: Captures vehicle conditions when DTCs were set
- **Historical Data Storage**: Maintains a history of vehicle parameters for trend analysis

### 2. Data Processing Layer

This layer transforms raw OBD-II data into structured, normalized information:

- **Data Normalization**: Converts raw values to standard units
- **Data Validation**: Filters out invalid or implausible readings
- **Data Enrichment**: Adds contextual information to raw values
- **Feature Extraction**: Derives higher-level features from raw data

### 3. Diagnostic Engine

This is the core of the AI assistant, responsible for analyzing the processed data:

- **Rule-Based Analysis**: Applies predefined diagnostic rules
- **Pattern Recognition**: Identifies abnormal patterns in sensor data
- **Correlation Analysis**: Finds relationships between different parameters
- **Anomaly Detection**: Identifies unusual behavior in vehicle systems

### 4. Knowledge Base

This component stores the information needed for accurate diagnostics:

- **DTC Database**: Comprehensive information about diagnostic trouble codes
- **Vehicle Specifications**: Normal parameter ranges for different vehicles
- **Common Issues Database**: Known problems and their symptoms
- **Repair Procedures**: Guidance for addressing identified issues

### 5. Natural Language Interface

This component translates technical information into human-readable insights:

- **Diagnostic Summaries**: Concise explanations of identified issues
- **Severity Assessment**: Classification of issues by urgency
- **Recommendation Engine**: Suggested actions based on diagnostics
- **Query Processing**: Interpretation of user questions about vehicle status

### 6. User Interface

This component presents the diagnostic information to the user:

- **Dashboard View**: Real-time display of key vehicle parameters
- **Diagnostic Alerts**: Notifications about potential issues
- **Detailed Reports**: In-depth analysis of vehicle health
- **Interactive Troubleshooting**: Step-by-step guidance for problem resolution

## Data Collection from OBD-II

The foundation of the AI diagnostic assistant is comprehensive data collection from the vehicle's OBD-II system.

### Key Parameters to Monitor

For effective diagnostics, the following parameters should be monitored:

1. **Engine Parameters**:
   - Engine RPM (PID 0x0C)
   - Engine Load (PID 0x04)
   - Coolant Temperature (PID 0x05)
   - Intake Air Temperature (PID 0x0F)
   - MAF Air Flow Rate (PID 0x10)
   - Throttle Position (PID 0x11)
   - Oxygen Sensor Readings (PIDs 0x14-0x1B)
   - Fuel System Status (PID 0x03)

2. **Emission System Parameters**:
   - Fuel Trim Values (PIDs 0x06-0x09)
   - Oxygen Sensor Voltages (PIDs 0x14-0x1B)
   - EGR System (PID 0x2C)
   - Evaporative System (PID 0x2E)
   - Catalyst Temperature (PIDs 0x3C-0x3F)

3. **Vehicle Operation Parameters**:
   - Vehicle Speed (PID 0x0D)
   - Timing Advance (PID 0x0E)
   - Fuel Pressure (PID 0x0A)
   - Intake Manifold Pressure (PID 0x0B)
   - Fuel Level (PID 0x2F)
   - Distance Traveled with MIL on (PID 0x21)

4. **Diagnostic Information**:
   - Diagnostic Trouble Codes (Mode 0x03)
   - Freeze Frame Data (Mode 0x02)
   - Oxygen Sensor Test Results (Mode 0x05)
   - On-board Monitoring Test Results (Mode 0x06)
   - Vehicle Information (Mode 0x09)

### Implementation Example

Here's how to implement comprehensive data collection:

```javascript
// Data collection manager
class ObdDataCollector {
  constructor() {
    // Collection configuration
    this.collectionActive = false;
    this.collectionInterval = 1000; // 1 second default
    this.parameters = [];
    this.dtcCheckInterval = 60000; // Check DTCs every minute
    this.dataStorage = new ObdDataStorage();
    
    // Monitoring state
    this.monitoringTimer = null;
    this.dtcCheckTimer = null;
    
    // Default parameters for basic monitoring
    this.basicParameters = [
      { mode: 0x01, pid: 0x0C, name: 'RPM', unit: 'rpm' },
      { mode: 0x01, pid: 0x0D, name: 'Speed', unit: 'km/h' },
      { mode: 0x01, pid: 0x05, name: 'Coolant', unit: '°C' },
      { mode: 0x01, pid: 0x04, name: 'Load', unit: '%' },
      { mode: 0x01, pid: 0x11, name: 'Throttle', unit: '%' }
    ];
    
    // Extended parameters for comprehensive monitoring
    this.extendedParameters = [
      ...this.basicParameters,
      { mode: 0x01, pid: 0x0F, name: 'IntakeTemp', unit: '°C' },
      { mode: 0x01, pid: 0x10, name: 'MAF', unit: 'g/s' },
      { mode: 0x01, pid: 0x0B, name: 'MAP', unit: 'kPa' },
      { mode: 0x01, pid: 0x0E, name: 'Timing', unit: '° before TDC' },
      { mode: 0x01, pid: 0x2F, name: 'FuelLevel', unit: '%' }
    ];
    
    // Advanced parameters for deep diagnostics
    this.advancedParameters = [
      ...this.extendedParameters,
      { mode: 0x01, pid: 0x06, name: 'STFT1', unit: '%' },
      { mode: 0x01, pid: 0x07, name: 'LTFT1', unit: '%' },
      { mode: 0x01, pid: 0x08, name: 'STFT2', unit: '%' },
      { mode: 0x01, pid: 0x09, name: 'LTFT2', unit: '%' },
      { mode: 0x01, pid: 0x0A, name: 'FuelPressure', unit: 'kPa' },
      { mode: 0x01, pid: 0x03, name: 'FuelStatus', unit: '' }
    ];
  }
  
  // Start data collection
  async startCollection(level = 'basic') {
    if (this.collectionActive) {
      await this.stopCollection();
    }
    
    // Set parameters based on level
    switch (level) {
      case 'basic':
        this.parameters = this.basicParameters;
        this.collectionInterval = 1000; // 1 second
        break;
      case 'extended':
        this.parameters = this.extendedParameters;
        this.collectionInterval = 2000; // 2 seconds
        break;
      case 'advanced':
        this.parameters = this.advancedParameters;
        this.collectionInterval = 3000; // 3 seconds
        break;
      default:
        this.parameters = this.basicParameters;
        this.collectionInterval = 1000;
    }
    
    // Check which parameters are supported
    await this.checkSupportedParameters();
    
    // Start continuous monitoring
    await this.startContinuousMonitoring();
    
    // Start periodic DTC checks
    this.startDtcChecks();
    
    this.collectionActive = true;
    console.log(`Started ${level} data collection`);
  }
  
  // Stop data collection
  async stopCollection() {
    // Stop continuous monitoring
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    // Stop OBD-II monitoring
    try {
      await ObdWiFi.stopContinuousMonitoring();
    } catch (error) {
      console.error('Error stopping continuous monitoring:', error);
    }
    
    // Stop DTC checks
    if (this.dtcCheckTimer) {
      clearInterval(this.dtcCheckTimer);
      this.dtcCheckTimer = null;
    }
    
    this.collectionActive = false;
    console.log('Stopped data collection');
  }
  
  // Check which parameters are supported by the vehicle
  async checkSupportedParameters() {
    try {
      // Get supported PIDs for mode 01
      const supportedPIDs = await ObdWiFi.getSupportedPIDs(0x01);
      
      if (!supportedPIDs || supportedPIDs.length === 0) {
        console.warn('Could not determine supported PIDs, using all parameters');
        return;
      }
      
      // Filter parameters to only include supported ones
      this.parameters = this.parameters.filter(param => {
        if (param.mode !== 0x01) return true; // Keep non-mode 01 parameters
        return supportedPIDs.includes(param.pid);
      });
      
      console.log(`Using ${this.parameters.length} supported parameters`);
    } catch (error) {
      console.error('Error checking supported parameters:', error);
    }
  }
  
  // Start continuous monitoring of parameters
  async startContinuousMonitoring() {
    try {
      // Convert parameters to format expected by OBD-II module
      const items = this.parameters.map(param => ({
        mode: param.mode,
        pid: param.pid
      }));
      
      // Start monitoring using the OBD-II module
      const started = await ObdWiFi.startContinuousMonitoring(items, this.collectionInterval);
      
      if (!started) {
        console.error('Failed to start continuous monitoring');
        return false;
      }
      
      // Set up event listener for data
      this.setupDataListener();
      
      return true;
    } catch (error) {
      console.error('Error starting continuous monitoring:', error);
      return false;
    }
  }
  
  // Set up listener for OBD-II data events
  setupDataListener() {
    // Remove any existing subscription
    if (this.dataSubscription) {
      this.dataSubscription.remove();
    }
    
    // Create new subscription
    this.dataSubscription = ObdWiFi.addListener((event) => {
      if (event.type === 'data' && event.data?.values) {
        // Process received data
        this.processReceivedData(event.data.values);
      }
    });
  }
  
  // Process data received from OBD-II
  processReceivedData(values) {
    // Create data point with timestamp
    const dataPoint = {
      timestamp: Date.now(),
      values: {}
    };
    
    // Process each parameter
    this.parameters.forEach(param => {
      const key = `${param.mode}:${param.pid}`;
      if (values[key] !== undefined) {
        // Store value with metadata
        dataPoint.values[param.name] = {
          value: values[key],
          unit: param.unit,
          raw: values[key]
        };
      }
    });
    
    // Store data point
    this.dataStorage.addDataPoint(dataPoint);
    
    // Emit event for real-time display
    this.emitDataUpdate(dataPoint);
    
    // Check for anomalies
    this.checkForAnomalies(dataPoint);
  }
  
  // Start periodic DTC checks
  startDtcChecks() {
    // Clear any existing timer
    if (this.dtcCheckTimer) {
      clearInterval(this.dtcCheckTimer);
    }
    
    // Function to check DTCs
    const checkDTCs = async () => {
      try {
        // Read DTCs
        const dtcs = await ObdWiFi.readDiagnosticCodes();
        
        if (dtcs && dtcs.length > 0) {
          console.log('DTCs found:', dtcs);
          
          // Store DTCs
          this.dataStorage.storeDTCs(dtcs);
          
          // Get freeze frame data if DTCs are present
          await this.getFreezeFrameData();
          
          // Emit DTC event
          this.emitDTCUpdate(dtcs);
        }
      } catch (error) {
        console.error('Error checking DTCs:', error);
      }
    };
    
    // Run initial check
    checkDTCs();
    
    // Set up periodic checks
    this.dtcCheckTimer = setInterval(checkDTCs, this.dtcCheckInterval);
  }
  
  // Get freeze frame data
  async getFreezeFrameData() {
    try {
      // This is a simplified implementation
      // In a real app, you would query mode 02 with the same PIDs as mode 01
      
      // Example: Get RPM from freeze frame
      const freezeFrameRPM = await ObdWiFi.sendPidRequest(0x02, 0x0C);
      
      if (freezeFrameRPM) {
        console.log('Freeze frame RPM:', freezeFrameRPM);
        
        // Store freeze frame data
        this.dataStorage.storeFreezeFrame({
          timestamp: Date.now(),
          rpm: freezeFrameRPM
          // Add more parameters as needed
        });
      }
    } catch (error) {
      console.error('Error getting freeze frame data:', error);
    }
  }
  
  // Emit data update event
  emitDataUpdate(dataPoint) {
    // This would integrate with your app's event system
    // For example, using EventEmitter or Redux
    if (this.onDataUpdate) {
      this.onDataUpdate(dataPoint);
    }
  }
  
  // Emit DTC update event
  emitDTCUpdate(dtcs) {
    // This would integrate with your app's event system
    if (this.onDTCUpdate) {
      this.onDTCUpdate(dtcs);
    }
  }
  
  // Check for anomalies in data
  checkForAnomalies(dataPoint) {
    // This is where you would implement real-time anomaly detection
    // For example, checking if values are outside normal ranges
    
    // Simple example: Check coolant temperature
    const coolant = dataPoint.values['Coolant'];
    if (coolant && coolant.value > 110) { // 110°C is very hot
      console.warn('Anomaly detected: High coolant temperature');
      
      // Emit anomaly event
      if (this.onAnomalyDetected) {
        this.onAnomalyDetected({
          type: 'high_coolant_temp',
          value: coolant.value,
          threshold: 110,
          severity: 'high',
          message: 'Engine is overheating'
        });
      }
    }
  }
}

// Data storage class
class ObdDataStorage {
  constructor() {
    this.recentData = []; // Recent data points (circular buffer)
    this.maxRecentDataPoints = 1000; // Store last 1000 data points
    this.dtcs = []; // Diagnostic trouble codes
    this.freezeFrames = []; // Freeze frame data
    this.anomalies = []; // Detected anomalies
  }
  
  // Add a data point to storage
  addDataPoint(dataPoint) {
    // Add to recent data
    this.recentData.push(dataPoint);
    
    // Keep only the most recent data points
    if (this.recentData.length > this.maxRecentDataPoints) {
      this.recentData.shift(); // Remove oldest
    }
    
    // In a real app, you might also:
    // - Store data in a local database
    // - Sync data to a cloud service
    // - Aggregate data for long-term storage
  }
  
  // Store DTCs
  storeDTCs(dtcs) {
    // Add timestamp
    const dtcEntry = {
      timestamp: Date.now(),
      codes: dtcs
    };
    
    this.dtcs.push(dtcEntry);
  }
  
  // Store freeze frame data
  storeFreezeFrame(freezeFrame) {
    this.freezeFrames.push(freezeFrame);
  }
  
  // Store detected anomaly
  storeAnomaly(anomaly) {
    this.anomalies.push({
      timestamp: Date.now(),
      ...anomaly
    });
  }
  
  // Get recent data for a specific parameter
  getParameterHistory(paramName, duration = 3600000) { // Default: last hour
    const now = Date.now();
    const cutoff = now - duration;
    
    return this.recentData
      .filter(dp => dp.timestamp >= cutoff && dp.values[paramName])
      .map(dp => ({
        timestamp: dp.timestamp,
        value: dp.values[paramName].value,
        unit: dp.values[paramName].unit
      }));
  }
  
  // Get DTCs for a specific time period
  getDTCs(duration = 86400000) { // Default: last 24 hours
    const now = Date.now();
    const cutoff = now - duration;
    
    return this.dtcs.filter(dtc => dtc.timestamp >= cutoff);
  }
}
```

## Diagnostic Algorithms

The diagnostic algorithms form the core intelligence of the AI assistant, analyzing the collected data to identify potential issues.

### Rule-Based Diagnostics

Rule-based diagnostics apply predefined rules to identify common issues:

```javascript
// Rule-based diagnostic engine
class RuleBasedDiagnostics {
  constructor() {
    // Initialize rules
    this.rules = this.initializeRules();
  }
  
  // Initialize diagnostic rules
  initializeRules() {
    return [
      // Engine overheating rule
      {
        id: 'engine_overheating',
        description: 'Engine Overheating',
        check: (data) => {
          const coolant = data.values['Coolant'];
          return coolant && coolant.value > 105; // Over 105°C
        },
        severity: 'high',
        message: 'Engine temperature is critically high. Stop driving as soon as safely possible to prevent engine damage.',
        advice: 'Check coolant level, radiator, and cooling fans. Look for leaks in the cooling system.'
      },
      
      // Low fuel rule
      {
        id: 'low_fuel',
        description: 'Low Fuel Level',
        check: (data) => {
          const fuel = data.values['FuelLevel'];
          return fuel && fuel.value < 15; // Under 15%
        },
        severity: 'medium',
        message: 'Fuel level is low.',
        advice: 'Refuel soon to avoid running out of fuel.'
      },
      
      // High RPM rule
      {
        id: 'high_rpm',
        description: 'Excessive Engine RPM',
        check: (data) => {
          const rpm = data.values['RPM'];
          return rpm && rpm.value > 5000; // Over 5000 RPM
        },
        severity: 'medium',
        message: 'Engine is running at high RPM.',
        advice: 'Consider shifting to a higher gear or reducing acceleration to prevent engine wear.'
      },
      
      // MAF sensor issue rule
      {
        id: 'maf_sensor_issue',
        description: 'Possible MAF Sensor Issue',
        check: (data) => {
          const maf = data.values['MAF'];
          const rpm = data.values['RPM'];
          const load = data.values['Load'];
          
          // Check if MAF reading is inconsistent with RPM and load
          return maf && rpm && load && 
                 ((rpm.value > 2500 && load.value > 50 && maf.value < 15) || 
                  (rpm.value < 1000 && maf.value > 30));
        },
        severity: 'medium',
        message: 'Mass Air Flow sensor readings are inconsistent with engine operation.',
        advice: 'Consider cleaning or replacing the MAF sensor.'
      },
      
      // Oxygen sensor issue rule
      {
        id: 'o2_sensor_issue',
        description: 'Possible Oxygen Sensor Issue',
        check: (data) => {
          const stft = data.values['STFT1'];
          const ltft = data.values['LTFT1'];
          
          // Check if fuel trims are significantly off
          return stft && ltft && 
                 (Math.abs(stft.value) > 15 || Math.abs(ltft.value) > 15);
        },
        severity: 'medium',
        message: 'Fuel trim values indicate a possible oxygen sensor issue or air leak.',
        advice: 'Check for exhaust leaks, intake leaks, or faulty oxygen sensors.'
      }
      
      // Add more rules as needed
    ];
  }
  
  // Run diagnostics on a data point
  runDiagnostics(dataPoint) {
    const results = [];
    
    // Apply each rule
    for (const rule of this.rules) {
      try {
        if (rule.check(dataPoint)) {
          results.push({
            ruleId: rule.id,
            description: rule.description,
            severity: rule.severity,
            message: rule.message,
            advice: rule.advice,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }
    
    return results;
  }
  
  // Diagnose DTCs
  diagnoseDTCs(dtcs) {
    return dtcs.map(dtc => {
      // In a real app, you would look up DTC information in a database
      // This is a simplified example
      
      let severity = 'medium';
      let description = 'Unknown issue';
      let advice = 'Consult a mechanic for further diagnosis.';
      
      // Example DTC interpretations
      if (dtc.code.startsWith('P0')) {
        if (dtc.code === 'P0300') {
          severity = 'high';
          description = 'Random/Multiple Cylinder Misfire Detected';
          advice = 'Check spark plugs, ignition coils, fuel injectors, and compression.';
        } else if (dtc.code.startsWith('P03')) {
          severity = 'high';
          description = 'Cylinder Misfire Detected';
          advice = 'Check spark plugs, ignition coils, and fuel injectors for the affected cylinder.';
        } else if (dtc.code.startsWith('P01')) {
          severity = 'medium';
          description = 'Fuel and Air Metering Issue';
          advice = 'Check fuel system, air intake, and related sensors.';
        } else if (dtc.code.startsWith('P02')) {
          severity = 'medium';
          description = 'Fuel and Air Metering Issue';
          advice = 'Check fuel system components and related sensors.';
        } else if (dtc.code.startsWith('P04')) {
          severity = 'medium';
          description = 'Auxiliary Emissions Controls Issue';
          advice = 'Check EGR system, EVAP system, or secondary air injection.';
        } else if (dtc.code.startsWith('P05')) {
          severity = 'medium';
          description = 'Vehicle Speed Control and Idle Control Issue';
          advice = 'Check idle control valve, throttle body, or cruise control system.';
        } else if (dtc.code.startsWith('P06')) {
          severity = 'medium';
          description = 'Computer Output Circuit Issue';
          advice = 'Check wiring and connections to the affected component.';
        } else if (dtc.code.startsWith('P07')) {
          severity = 'medium';
          description = 'Transmission Issue';
          advice = 'Check transmission components and related sensors.';
        }
      } else if (dtc.code.startsWith('C')) {
        severity = 'high';
        description = 'Chassis Issue';
        advice = 'Check ABS, traction control, or stability control systems.';
      } else if (dtc.code.startsWith('B')) {
        severity = 'medium';
        description = 'Body Issue';
        advice = 'Check body-related systems like airbags, power seats, or climate control.';
      } else if (dtc.code.startsWith('U')) {
        severity = 'medium';
        description = 'Network Communication Issue';
        advice = 'Check communication networks between vehicle modules.';
      }
      
      return {
        code: dtc.code,
        severity,
        description,
        advice,
        timestamp: Date.now()
      };
    });
  }
}
```

### Pattern Recognition

Pattern recognition algorithms identify abnormal patterns in sensor data:

```javascript
// Pattern recognition engine
class PatternRecognitionEngine {
  constructor(dataStorage) {
    this.dataStorage = dataStorage;
    this.patterns = this.initializePatterns();
  }
  
  // Initialize pattern definitions
  initializePatterns() {
    return [
      // RPM fluctuation pattern
      {
        id: 'rpm_fluctuation',
        description: 'Engine RPM Fluctuation',
        parameter: 'RPM',
        detectPattern: (history) => {
          if (history.length < 10) return false;
          
          // Calculate standard deviation
          const values = history.map(dp => dp.value);
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          
          // Check if standard deviation is high while mean is relatively low
          // (indicating idle or steady-state driving with fluctuations)
          return mean < 2000 && stdDev > 200;
        },
        severity: 'medium',
        message: 'Engine RPM is fluctuating abnormally.',
        advice: 'Check for vacuum leaks, dirty throttle body, or fuel delivery issues.'
      },
      
      // Coolant temperature rise pattern
      {
        id: 'rapid_temp_rise',
        description: 'Rapid Coolant Temperature Rise',
        parameter: 'Coolant',
        detectPattern: (history) => {
          if (history.length < 10) return false;
          
          // Check for rapid temperature increase
          const timeWindow = 5 * 60 * 1000; // 5 minutes
          const now = Date.now();
          const recentPoints = history.filter(dp => now - dp.timestamp < timeWindow);
          
          if (recentPoints.length < 5) return false;
          
          const oldestTemp = recentPoints[0].value;
          const newestTemp = recentPoints[recentPoints.length - 1].value;
          const tempRise = newestTemp - oldestTemp;
          const timeSpan = (recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp) / 60000; // minutes
          
          // Alert if temperature rises more than 20°C in less than 5 minutes
          return tempRise > 20 && timeSpan < 5;
        },
        severity: 'high',
        message: 'Engine temperature is rising abnormally quickly.',
        advice: 'Check coolant level, thermostat, water pump, and radiator immediately.'
      },
      
      // Fuel consumption pattern
      {
        id: 'increased_fuel_consumption',
        description: 'Increased Fuel Consumption',
        parameter: 'FuelLevel',
        detectPattern: (history) => {
          if (history.length < 20) return false;
          
          // This is a simplified example
          // In a real app, you would calculate fuel consumption rate
          // based on fuel level changes and distance traveled
          
          // For this example, we'll just check if fuel level is dropping faster than expected
          const timeWindow = 30 * 60 * 1000; // 30 minutes
          const now = Date.now();
          const recentPoints = history.filter(dp => now - dp.timestamp < timeWindow);
          
          if (recentPoints.length < 10) return false;
          
          const oldestLevel = recentPoints[0].value;
          const newestLevel = recentPoints[recentPoints.length - 1].value;
          const levelDrop = oldestLevel - newestLevel;
          const timeSpan = (recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp) / 3600000; // hours
          
          // Alert if fuel level drops more than 10% per hour
          return levelDrop > 10 && (levelDrop / timeSpan) > 10;
        },
        severity: 'medium',
        message: 'Fuel consumption appears to be higher than normal.',
        advice: 'Check for fuel leaks, dragging brakes, tire pressure, or excessive idling.'
      }
      
      // Add more patterns as needed
    ];
  }
  
  // Analyze data for patterns
  analyzePatterns() {
    const results = [];
    
    // Check each pattern
    for (const pattern of this.patterns) {
      try {
        // Get history for the parameter
        const history = this.dataStorage.getParameterHistory(pattern.parameter, 3600000); // Last hour
        
        if (history.length > 0) {
          // Check if pattern is detected
          if (pattern.detectPattern(history)) {
            results.push({
              patternId: pattern.id,
              description: pattern.description,
              severity: pattern.severity,
              message: pattern.message,
              advice: pattern.advice,
              parameter: pattern.parameter,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        console.error(`Error analyzing pattern ${pattern.id}:`, error);
      }
    }
    
    return results;
  }
}
```

### Integration with Language Models

To provide natural language diagnostics, we can integrate with language models:

```javascript
// Language model integration
class DiagnosticLanguageModel {
  constructor() {
    // Configuration
    this.apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4'; // Or another suitable model
  }
  
  // Generate diagnostic explanation
  async generateDiagnostic(vehicleData, issues) {
    try {
      // Create prompt with vehicle data and detected issues
      const prompt = this.createDiagnosticPrompt(vehicleData, issues);
      
      // Call language model API
      const response = await this.callLanguageModel(prompt);
      
      return response;
    } catch (error) {
      console.error('Error generating diagnostic:', error);
      return 'Unable to generate diagnostic explanation. Please check the detected issues for more information.';
    }
  }
  
  // Create prompt for diagnostic explanation
  createDiagnosticPrompt(vehicleData, issues) {
    // Format vehicle data
    const formattedData = Object.entries(vehicleData)
      .map(([key, value]) => `${key}: ${value.value} ${value.unit}`)
      .join('\n');
    
    // Format issues
    const formattedIssues = issues
      .map(issue => `- ${issue.description} (Severity: ${issue.severity})`)
      .join('\n');
    
    // Create prompt
    return `You are an automotive diagnostic expert. Based on the following vehicle data and detected issues, provide a clear, concise explanation of what might be wrong with the vehicle, potential causes, and recommended actions. Use simple language that a non-expert can understand.

Vehicle Data:
${formattedData}

Detected Issues:
${formattedIssues}

Diagnostic Explanation:`;
  }
  
  // Call language model API
  async callLanguageModel(prompt) {
    try {
      // Make API request
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are an automotive diagnostic expert providing clear, concise explanations.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });
      
      // Parse response
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('Invalid response from language model');
      }
    } catch (error) {
      console.error('Error calling language model:', error);
      throw error;
    }
  }
  
  // Answer user question about vehicle
  async answerQuestion(question, vehicleData, issues) {
    try {
      // Create prompt with vehicle data, issues, and user question
      const prompt = this.createQuestionPrompt(question, vehicleData, issues);
      
      // Call language model API
      const response = await this.callLanguageModel(prompt);
      
      return response;
    } catch (error) {
      console.error('Error answering question:', error);
      return 'I\'m sorry, I couldn\'t process your question. Please try asking in a different way.';
    }
  }
  
  // Create prompt for answering user question
  createQuestionPrompt(question, vehicleData, issues) {
    // Format vehicle data
    const formattedData = Object.entries(vehicleData)
      .map(([key, value]) => `${key}: ${value.value} ${value.unit}`)
      .join('\n');
    
    // Format issues
    const formattedIssues = issues.length > 0 
      ? issues
          .map(issue => `- ${issue.description} (Severity: ${issue.severity})`)
          .join('\n')
      : 'No issues detected.';
    
    // Create prompt
    return `You are an automotive diagnostic expert. Answer the user's question based on the following vehicle data and detected issues. Provide a clear, concise response using simple language that a non-expert can understand.

Vehicle Data:
${formattedData}

Detected Issues:
${formattedIssues}

User Question: "${question}"

Answer:`;
  }
}
```

## User Interface for Diagnostic Results

The user interface presents diagnostic information in a clear, actionable format.

### Diagnostic Dashboard

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Diagnostic Dashboard Component
const DiagnosticDashboard = ({ 
  vehicleData, 
  issues, 
  dtcs, 
  onRequestDiagnostic,
  onAskQuestion
}) => {
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterHistory, setParameterHistory] = useState([]);
  
  // Update parameter history when selected parameter changes
  useEffect(() => {
    if (selectedParameter) {
      // In a real app, you would fetch history from your data storage
      // This is a placeholder
      const mockHistory = generateMockHistory(selectedParameter);
      setParameterHistory(mockHistory);
    }
  }, [selectedParameter]);
  
  // Generate mock history data for demonstration
  const generateMockHistory = (parameter) => {
    const now = Date.now();
    const history = [];
    
    for (let i = 0; i < 20; i++) {
      const timestamp = now - (19 - i) * 60000; // One point per minute
      let value;
      
      // Generate somewhat realistic values based on parameter
      switch (parameter) {
        case 'RPM':
          value = 800 + Math.random() * 200; // Idle RPM with variation
          break;
        case 'Speed':
          value = Math.random() * 60; // 0-60 km/h
          break;
        case 'Coolant':
          value = 80 + Math.random() * 10; // Normal operating temperature
          break;
        default:
          value = Math.random() * 100;
      }
      
      history.push({ timestamp, value });
    }
    
    return history;
  };
  
  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <Icon name="alert-circle" size={24} color="#FF0000" />;
      case 'medium':
        return <Icon name="alert" size={24} color="#FFA500" />;
      case 'low':
        return <Icon name="information" size={24} color="#0000FF" />;
      default:
        return <Icon name="information-outline" size={24} color="#808080" />;
    }
  };
  
  // Format chart data
  const getChartData = () => {
    if (!parameterHistory || parameterHistory.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{ data: [0] }]
      };
    }
    
    // Extract labels (timestamps) and values
    const labels = parameterHistory.map(dp => {
      const date = new Date(dp.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const data = parameterHistory.map(dp => dp.value);
    
    return {
      labels: labels.filter((_, i) => i % 4 === 0), // Show every 4th label to avoid crowding
      datasets: [{ data }]
    };
  };
  
  // Get parameter unit
  const getParameterUnit = (parameter) => {
    if (!vehicleData || !vehicleData[parameter]) return '';
    return vehicleData[parameter].unit;
  };
  
  // Handle diagnostic request
  const handleDiagnosticRequest = () => {
    onRequestDiagnostic();
  };
  
  // Handle ask question
  const handleAskQuestion = () => {
    Alert.prompt(
      'Ask about your vehicle',
      'What would you like to know?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Ask', onPress: question => onAskQuestion(question) }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Status Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Status</Text>
        <View style={styles.statusGrid}>
          {vehicleData && Object.entries(vehicleData).map(([key, data]) => (
            <TouchableOpacity 
              key={key} 
              style={styles.statusItem}
              onPress={() => setSelectedParameter(key)}
            >
              <Text style={styles.statusLabel}>{key}</Text>
              <Text style={styles.statusValue}>
                {data.value !== undefined ? data.value.toFixed(1) : 'N/A'} {data.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Parameter History Chart */}
      {selectedParameter && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{selectedParameter} History</Text>
          <LineChart
            data={getChartData()}
            width={350}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
          <Text style={styles.chartUnit}>Unit: {getParameterUnit(selectedParameter)}</Text>
        </View>
      )}
      
      {/* Detected Issues */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detected Issues</Text>
        {issues && issues.length > 0 ? (
          issues.map((issue, index) => (
            <View key={index} style={styles.issueItem}>
              {getSeverityIcon(issue.severity)}
              <View style={styles.issueContent}>
                <Text style={styles.issueTitle}>{issue.description}</Text>
                <Text style={styles.issueMessage}>{issue.message}</Text>
                <Text style={styles.issueAdvice}>{issue.advice}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noIssuesText}>No issues detected</Text>
        )}
      </View>
      
      {/* Diagnostic Trouble Codes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnostic Trouble Codes</Text>
        {dtcs && dtcs.length > 0 ? (
          dtcs.map((dtc, index) => (
            <View key={index} style={styles.dtcItem}>
              {getSeverityIcon(dtc.severity)}
              <View style={styles.dtcContent}>
                <Text style={styles.dtcCode}>{dtc.code}</Text>
                <Text style={styles.dtcDescription}>{dtc.description}</Text>
                <Text style={styles.dtcAdvice}>{dtc.advice}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noIssuesText}>No DTCs present</Text>
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.diagnosticButton]}
          onPress={handleDiagnosticRequest}
        >
          <Icon name="car-wrench" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Run Diagnostic</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.questionButton]}
          onPress={handleAskQuestion}
        >
          <Icon name="help-circle" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Ask Question</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5'
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333'
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statusItem: {
    width: '48%',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666'
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 4
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  chartUnit: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 12
  },
  issueItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  issueContent: {
    marginLeft: 12,
    flex: 1
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333'
  },
  issueMessage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4
  },
  issueAdvice: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#0066CC',
    marginTop: 4
  },
  noIssuesText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16
  },
  dtcItem: {
    flexDirection: 'row',
    backgroundColor: '#F0F0FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  dtcContent: {
    marginLeft: 12,
    flex: 1
  },
  dtcCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333'
  },
  dtcDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4
  },
  dtcAdvice: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#0066CC',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 16,
    borderRadius: 8
  },
  diagnosticButton: {
    backgroundColor: '#4CAF50'
  },
  questionButton: {
    backgroundColor: '#2196F3'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8
  }
});

export default DiagnosticDashboard;
```

## Integration with Language Models for Natural Language Diagnostics

To provide more natural and comprehensive diagnostics, we can integrate with language models:

```javascript
// Main AI Diagnostic Assistant
class AIDiagnosticAssistant {
  constructor() {
    // Initialize components
    this.dataCollector = new ObdDataCollector();
    this.ruleEngine = new RuleBasedDiagnostics();
    this.patternEngine = new PatternRecognitionEngine(this.dataCollector.dataStorage);
    this.languageModel = new DiagnosticLanguageModel();
    
    // State
    this.isRunning = false;
    this.diagnosticInterval = 60000; // Run diagnostics every minute
    this.diagnosticTimer = null;
    
    // Event handlers
    this.onDiagnosticResult = null;
    this.onStatusUpdate = null;
  }
  
  // Start the assistant
  async start(level = 'basic') {
    if (this.isRunning) {
      await this.stop();
    }
    
    try {
      // Start data collection
      await this.dataCollector.startCollection(level);
      
      // Set up diagnostic timer
      this.diagnosticTimer = setInterval(() => {
        this.runDiagnostics();
      }, this.diagnosticInterval);
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isRunning = true;
      
      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          status: 'running',
          level,
          message: `AI Diagnostic Assistant started in ${level} mode`
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error starting AI Diagnostic Assistant:', error);
      
      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          status: 'error',
          message: `Failed to start: ${error.message}`
        });
      }
      
      return false;
    }
  }
  
  // Stop the assistant
  async stop() {
    try {
      // Stop data collection
      await this.dataCollector.stopCollection();
      
      // Clear diagnostic timer
      if (this.diagnosticTimer) {
        clearInterval(this.diagnosticTimer);
        this.diagnosticTimer = null;
      }
      
      // Remove event listeners
      this.removeEventListeners();
      
      this.isRunning = false;
      
      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          status: 'stopped',
          message: 'AI Diagnostic Assistant stopped'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping AI Diagnostic Assistant:', error);
      return false;
    }
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Set up data update handler
    this.dataCollector.onDataUpdate = (dataPoint) => {
      // Process real-time data updates
      this.processRealTimeData(dataPoint);
    };
    
    // Set up DTC update handler
    this.dataCollector.onDTCUpdate = (dtcs) => {
      // Process DTCs
      this.processDTCs(dtcs);
    };
    
    // Set up anomaly detection handler
    this.dataCollector.onAnomalyDetected = (anomaly) => {
      // Process detected anomaly
      this.processAnomaly(anomaly);
    };
  }
  
  // Remove event listeners
  removeEventListeners() {
    this.dataCollector.onDataUpdate = null;
    this.dataCollector.onDTCUpdate = null;
    this.dataCollector.onAnomalyDetected = null;
  }
  
  // Process real-time data
  processRealTimeData(dataPoint) {
    // Run rule-based diagnostics on real-time data
    const ruleResults = this.ruleEngine.runDiagnostics(dataPoint);
    
    // If issues found, emit diagnostic result
    if (ruleResults.length > 0 && this.onDiagnosticResult) {
      this.onDiagnosticResult({
        type: 'rule_based',
        issues: ruleResults,
        data: dataPoint,
        timestamp: Date.now()
      });
    }
  }
  
  // Process DTCs
  processDTCs(dtcs) {
    // Diagnose DTCs
    const dtcResults = this.ruleEngine.diagnoseDTCs(dtcs);
    
    // Emit diagnostic result
    if (this.onDiagnosticResult) {
      this.onDiagnosticResult({
        type: 'dtc',
        issues: dtcResults,
        data: { dtcs },
        timestamp: Date.now()
      });
    }
  }
  
  // Process anomaly
  processAnomaly(anomaly) {
    // Emit diagnostic result
    if (this.onDiagnosticResult) {
      this.onDiagnosticResult({
        type: 'anomaly',
        issues: [anomaly],
        data: { anomaly },
        timestamp: Date.now()
      });
    }
  }
  
  // Run comprehensive diagnostics
  async runDiagnostics() {
    try {
      // Get latest data point
      const latestData = this.dataCollector.dataStorage.recentData[
        this.dataCollector.dataStorage.recentData.length - 1
      ];
      
      if (!latestData) return;
      
      // Run rule-based diagnostics
      const ruleResults = this.ruleEngine.runDiagnostics(latestData);
      
      // Run pattern recognition
      const patternResults = this.patternEngine.analyzePatterns();
      
      // Get DTCs
      const dtcs = this.dataCollector.dataStorage.getDTCs();
      const dtcResults = dtcs.length > 0 ? this.ruleEngine.diagnoseDTCs(dtcs[dtcs.length - 1].codes) : [];
      
      // Combine all issues
      const allIssues = [...ruleResults, ...patternResults, ...dtcResults];
      
      // If issues found, generate natural language diagnostic
      if (allIssues.length > 0) {
        // Generate diagnostic explanation
        const explanation = await this.languageModel.generateDiagnostic(
          latestData.values,
          allIssues
        );
        
        // Emit comprehensive diagnostic result
        if (this.onDiagnosticResult) {
          this.onDiagnosticResult({
            type: 'comprehensive',
            issues: allIssues,
            data: latestData,
            explanation,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
    }
  }
  
  // Answer user question
  async answerQuestion(question) {
    try {
      // Get latest data
      const latestData = this.dataCollector.dataStorage.recentData[
        this.dataCollector.dataStorage.recentData.length - 1
      ];
      
      if (!latestData) {
        return 'I don\'t have enough vehicle data to answer your question yet.';
      }
      
      // Get current issues
      const dtcs = this.dataCollector.dataStorage.getDTCs();
      const dtcResults = dtcs.length > 0 ? this.ruleEngine.diagnoseDTCs(dtcs[dtcs.length - 1].codes) : [];
      
      const ruleResults = this.ruleEngine.runDiagnostics(latestData);
      const patternResults = this.patternEngine.analyzePatterns();
      
      const allIssues = [...ruleResults, ...patternResults, ...dtcResults];
      
      // Generate answer using language model
      const answer = await this.languageModel.answerQuestion(
        question,
        latestData.values,
        allIssues
      );
      
      return answer;
    } catch (error) {
      console.error('Error answering question:', error);
      return 'I\'m sorry, I encountered an error while processing your question.';
    }
  }
}
```

## Example Application Integration

Here's how to integrate the AI diagnostic assistant into a React Native application:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import ObdWiFi from 'react-native-obd-wifi';
import DiagnosticDashboard from './DiagnosticDashboard';
import { AIDiagnosticAssistant } from './AIDiagnosticAssistant';

const App = () => {
  // State
  const [connectionState, setConnectionState] = useState('disconnected');
  const [vehicleData, setVehicleData] = useState({});
  const [issues, setIssues] = useState([]);
  const [dtcs, setDtcs] = useState([]);
  const [diagnosticExplanation, setDiagnosticExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Initialize AI assistant
  const [assistant] = useState(() => new AIDiagnosticAssistant());
  
  // Set up assistant event handlers
  useEffect(() => {
    // Handle diagnostic results
    assistant.onDiagnosticResult = (result) => {
      console.log('Diagnostic result:', result);
      
      // Update issues
      if (result.issues && result.issues.length > 0) {
        setIssues(prevIssues => {
          // Combine issues, avoiding duplicates
          const newIssues = [...prevIssues];
          
          result.issues.forEach(issue => {
            const existingIndex = newIssues.findIndex(i => 
              (i.ruleId && i.ruleId === issue.ruleId) ||
              (i.patternId && i.patternId === issue.patternId) ||
              (i.code && i.code === issue.code)
            );
            
            if (existingIndex >= 0) {
              newIssues[existingIndex] = issue; // Replace with updated issue
            } else {
              newIssues.push(issue); // Add new issue
            }
          });
          
          return newIssues;
        });
      }
      
      // Update DTCs
      if (result.type === 'dtc' && result.data.dtcs) {
        setDtcs(result.issues);
      }
      
      // Update explanation
      if (result.explanation) {
        setDiagnosticExplanation(result.explanation);
      }
    };
    
    // Handle status updates
    assistant.onStatusUpdate = (status) => {
      console.log('Assistant status:', status);
      
      if (status.status === 'error') {
        Alert.alert('Assistant Error', status.message);
      }
    };
    
    // Clean up
    return () => {
      assistant.stop();
    };
  }, [assistant]);
  
  // Connect to OBD adapter
  const connectToAdapter = async () => {
    setLoading(true);
    setConnectionState('connecting');
    
    try {
      // Connect to adapter
      const connected = await ObdWiFi.connect({
        ipAddress: '192.168.0.10', // ZAKVOP default
        port: 35000, // ZAKVOP default
        autoConnect: true,
        connectionTimeout: 10000,
        responseTimeout: 5000,
        protocol: 0 // Auto-detect protocol
      });
      
      if (connected) {
        // Initialize connection
        const initialized = await ObdWiFi.initializeConnection();
        
        if (initialized) {
          setConnectionState('connected');
          
          // Start AI assistant
          const started = await assistant.start('extended');
          
          if (!started) {
            Alert.alert('Warning', 'Connected to adapter but failed to start diagnostic assistant.');
          }
        } else {
          setConnectionState('error');
          Alert.alert('Connection Error', 'Connected to adapter but failed to initialize communication.');
        }
      } else {
        setConnectionState('error');
        Alert.alert('Connection Error', 'Failed to connect to the OBD adapter.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState('error');
      Alert.alert('Connection Error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Disconnect from adapter
  const disconnectFromAdapter = async () => {
    setLoading(true);
    
    try {
      // Stop assistant
      await assistant.stop();
      
      // Disconnect from adapter
      await ObdWiFi.disconnect();
      
      setConnectionState('disconnected');
      setVehicleData({});
      setIssues([]);
      setDtcs([]);
      setDiagnosticExplanation('');
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Disconnect Error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Update vehicle data (called by assistant)
  const updateVehicleData = (data) => {
    setVehicleData(data);
  };
  
  // Request comprehensive diagnostic
  const requestDiagnostic = async () => {
    setLoading(true);
    
    try {
      await assistant.runDiagnostics();
      
      if (diagnosticExplanation) {
        Alert.alert('Diagnostic Result', diagnosticExplanation);
      } else {
        Alert.alert('Diagnostic Result', 'No issues detected.');
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      Alert.alert('Diagnostic Error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Ask question about vehicle
  const askQuestion = async (question) => {
    setLoading(true);
    
    try {
      const answer = await assistant.answerQuestion(question);
      Alert.alert('Answer', answer);
    } catch (error) {
      console.error('Question error:', error);
      Alert.alert('Error', `Failed to answer question: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render connection screen
  const renderConnectionScreen = () => {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>OBD-II AI Diagnostic Assistant</Text>
        <Text style={styles.subtitle}>Connect to your ZAKVOP OBD-II adapter</Text>
        
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={connectToAdapter}
          disabled={loading || connectionState === 'connecting'}
        >
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        
        {loading && <ActivityIndicator style={styles.loader} size="large" color="#0066CC" />}
      </View>
    );
  };
  
  // Render main screen
  const renderMainScreen = () => {
    return (
      <View style={styles.container}>
        <DiagnosticDashboard
          vehicleData={vehicleData}
          issues={issues}
          dtcs={dtcs}
          onRequestDiagnostic={requestDiagnostic}
          onAskQuestion={askQuestion}
        />
        
        <TouchableOpacity 
          style={styles.disconnectButton}
          onPress={disconnectFromAdapter}
          disabled={loading}
        >
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {connectionState === 'connected' ? renderMainScreen() : renderConnectionScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  container: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center'
  },
  connectButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loader: {
    marginTop: 24
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default App;
```

This implementation provides a comprehensive AI diagnostic assistant that can:

1. Collect real-time data from the vehicle via the OBD-II WiFi module
2. Apply rule-based diagnostics to identify common issues
3. Use pattern recognition to detect abnormal behavior
4. Integrate with language models for natural language diagnostics
5. Present diagnostic information in a user-friendly interface
6. Answer user questions about the vehicle's status

By combining these components, you can create a powerful AI vehicle assistant that helps users diagnose and understand their vehicle's issues.

In the next section, we'll explore specific compatibility details for the ZAKVOP OBD2 scanner.
# 12. ZAKVOP OBD2 Scanner Specific Compatibility

This section provides detailed information about the ZAKVOP OBD2 scanner and how to ensure optimal compatibility with your React Native application.

## ZAKVOP OBD2 Scanner Overview

The ZAKVOP OBD2 scanner is a versatile diagnostic tool with the following key features:

1. **Wide Vehicle Compatibility**: Works with all OBD-II compliant vehicles manufactured since 1996, including gasoline and 12V diesel vehicles.

2. **Connectivity Options**: Supports both WiFi and Bluetooth connectivity, making it compatible with Android devices, iOS devices, and Windows PCs.

3. **High-Quality Chip**: Features a high-performance chip that enables faster reading speeds compared to many other OBD2 scanners:
   - Reads diagnostic trouble codes within 1.9 seconds
   - Clears fault codes within 3.8 seconds

4. **Full Protocol Support**: Supports all seven OBD-II protocols:
   - ISO9141-2 (5 baud init, 10.4 Kbaud)
   - ISO14230-4 KWP (5 baud init, 10.4 Kbaud)
   - ISO14230-4 KWP (quick start, 10.4 Kbaud)
   - ISO15765-4 CAN (11-bit ID, 500 Kbaud)
   - ISO15765-4 CAN (29-bit ID, 500 Kbaud)
   - ISO15765-4 CAN (11-bit ID, 250 Kbaud)
   - ISO15765-4 CAN (29-bit ID, 250 Kbaud)

5. **Comprehensive Data Access**: Provides access to a wide range of vehicle data:
   - Read and clear check engine light fault codes
   - View real-time sensor data (O2 sensors, fuel pressure, engine load, etc.)
   - Access freeze frame data
   - Check emissions system readiness
   - Support for map-based sensor tracking with certain apps

## ZAKVOP-Specific Configuration

To ensure optimal compatibility with the ZAKVOP OBD2 scanner, you'll need to configure your application with the correct connection parameters.

### WiFi Connection Parameters

The ZAKVOP scanner creates its own WiFi network with the following default settings:

```javascript
// ZAKVOP WiFi connection parameters
const ZAKVOP_WIFI_CONFIG = {
  // WiFi network details (check your specific device)
  ssid: 'OBDII', // Typical prefix, may include additional characters
  password: '12345678', // Default password, may vary
  
  // Socket connection details
  ipAddress: '192.168.0.10', // Default IP address
  port: 35000, // Default port
  
  // Connection timeouts
  connectionTimeout: 10000, // 10 seconds
  responseTimeout: 5000, // 5 seconds
};
```

### Optimized Initialization Sequence

Based on the ZAKVOP's high-performance chip, you can optimize the initialization sequence for faster startup:

```javascript
// Optimized initialization sequence for ZAKVOP
async function initializeZakvopAdapter() {
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
      'ATST32'    // Timeout 3.2 seconds (faster than default)
    ];
    
    // Execute commands sequentially
    for (const command of initCommands) {
      console.log(`Sending: ${command}`);
      const success = await ObdWiFi.sendCommand(command);
      
      if (!success) {
        console.error(`Failed to send command: ${command}`);
        return false;
      }
      
      // Shorter delay between commands (ZAKVOP responds quickly)
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('ZAKVOP adapter initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing ZAKVOP adapter:', error);
    return false;
  }
}
```

### Optimized Data Polling Rates

The ZAKVOP's faster reading speeds allow for more frequent data polling:

```javascript
// Optimized polling configuration for ZAKVOP
const ZAKVOP_POLLING_CONFIG = {
  // Basic parameters (can be polled frequently)
  basicParameters: {
    pollInterval: 500, // 500ms (2 times per second)
    parameters: [
      { mode: 0x01, pid: 0x0C, name: 'RPM', unit: 'rpm' },
      { mode: 0x01, pid: 0x0D, name: 'Speed', unit: 'km/h' },
      { mode: 0x01, pid: 0x05, name: 'Coolant', unit: '°C' },
      { mode: 0x01, pid: 0x04, name: 'Load', unit: '%' },
      { mode: 0x01, pid: 0x11, name: 'Throttle', unit: '%' }
    ]
  },
  
  // Extended parameters (polled less frequently)
  extendedParameters: {
    pollInterval: 1000, // 1000ms (once per second)
    parameters: [
      { mode: 0x01, pid: 0x0F, name: 'IntakeTemp', unit: '°C' },
      { mode: 0x01, pid: 0x10, name: 'MAF', unit: 'g/s' },
      { mode: 0x01, pid: 0x0B, name: 'MAP', unit: 'kPa' },
      { mode: 0x01, pid: 0x0E, name: 'Timing', unit: '° before TDC' },
      { mode: 0x01, pid: 0x2F, name: 'FuelLevel', unit: '%' }
    ]
  },
  
  // Advanced parameters (polled least frequently)
  advancedParameters: {
    pollInterval: 2000, // 2000ms (once every 2 seconds)
    parameters: [
      { mode: 0x01, pid: 0x06, name: 'STFT1', unit: '%' },
      { mode: 0x01, pid: 0x07, name: 'LTFT1', unit: '%' },
      { mode: 0x01, pid: 0x08, name: 'STFT2', unit: '%' },
      { mode: 0x01, pid: 0x09, name: 'LTFT2', unit: '%' },
      { mode: 0x01, pid: 0x0A, name: 'FuelPressure', unit: 'kPa' },
      { mode: 0x01, pid: 0x03, name: 'FuelStatus', unit: '' }
    ]
  },
  
  // DTC check interval
  dtcCheckInterval: 30000 // 30 seconds
};
```

## ZAKVOP-Specific Connection Manager

Here's a connection manager class specifically optimized for the ZAKVOP scanner:

```javascript
// ZAKVOP Connection Manager
class ZakvopConnectionManager {
  constructor() {
    // Connection state
    this.connected = false;
    this.initialized = false;
    this.connectionConfig = { ...ZAKVOP_WIFI_CONFIG };
    
    // Event callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onError = null;
    this.onInitialized = null;
    
    // Set up event listener
    this.setupEventListener();
  }
  
  // Set up event listener for OBD events
  setupEventListener() {
    this.subscription = ObdWiFi.addListener((event) => {
      if (event.type === 'connection') {
        if (event.message.includes('Connected')) {
          this.connected = true;
          if (this.onConnected) this.onConnected();
        } else if (event.message.includes('Disconnected')) {
          this.connected = false;
          this.initialized = false;
          if (this.onDisconnected) this.onDisconnected();
        }
      } else if (event.type === 'error') {
        if (this.onError) this.onError(event.message);
      }
    });
  }
  
  // Connect to ZAKVOP adapter
  async connect() {
    try {
      // Check if already connected
      if (this.connected) {
        console.log('Already connected to ZAKVOP adapter');
        return true;
      }
      
      console.log('Connecting to ZAKVOP adapter...');
      
      // Connect to adapter
      const connected = await ObdWiFi.connect({
        ipAddress: this.connectionConfig.ipAddress,
        port: this.connectionConfig.port,
        autoConnect: true,
        connectionTimeout: this.connectionConfig.connectionTimeout,
        responseTimeout: this.connectionConfig.responseTimeout,
        protocol: 0 // Auto-detect protocol
      });
      
      if (connected) {
        console.log('Connected to ZAKVOP adapter');
        this.connected = true;
        
        // Initialize adapter
        const initialized = await this.initialize();
        
        if (initialized) {
          console.log('ZAKVOP adapter initialized');
          this.initialized = true;
          if (this.onInitialized) this.onInitialized();
        } else {
          console.error('Failed to initialize ZAKVOP adapter');
        }
        
        return initialized;
      } else {
        console.error('Failed to connect to ZAKVOP adapter');
        return false;
      }
    } catch (error) {
      console.error('Error connecting to ZAKVOP adapter:', error);
      if (this.onError) this.onError(error.message);
      return false;
    }
  }
  
  // Initialize ZAKVOP adapter
  async initialize() {
    try {
      return await initializeZakvopAdapter();
    } catch (error) {
      console.error('Error initializing ZAKVOP adapter:', error);
      if (this.onError) this.onError(error.message);
      return false;
    }
  }
  
  // Disconnect from ZAKVOP adapter
  async disconnect() {
    try {
      // Check if already disconnected
      if (!this.connected) {
        console.log('Already disconnected from ZAKVOP adapter');
        return true;
      }
      
      console.log('Disconnecting from ZAKVOP adapter...');
      
      // Disconnect from adapter
      await ObdWiFi.disconnect();
      
      this.connected = false;
      this.initialized = false;
      
      console.log('Disconnected from ZAKVOP adapter');
      
      return true;
    } catch (error) {
      console.error('Error disconnecting from ZAKVOP adapter:', error);
      if (this.onError) this.onError(error.message);
      return false;
    }
  }
  
  // Check if connected to ZAKVOP adapter
  async isConnected() {
    try {
      const connected = await ObdWiFi.isConnected();
      this.connected = connected;
      return connected;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  }
  
  // Get adapter information
  async getAdapterInfo() {
    try {
      if (!this.connected) {
        throw new Error('Not connected to ZAKVOP adapter');
      }
      
      // Get adapter version
      const version = await ObdWiFi.sendCommand('ATI');
      
      // Get protocol
      const protocol = await ObdWiFi.sendCommand('ATDP');
      
      // Get voltage
      const voltage = await ObdWiFi.sendCommand('ATRV');
      
      return {
        version: version || 'Unknown',
        protocol: protocol || 'Unknown',
        voltage: voltage || 'Unknown'
      };
    } catch (error) {
      console.error('Error getting adapter info:', error);
      return {
        version: 'Unknown',
        protocol: 'Unknown',
        voltage: 'Unknown'
      };
    }
  }
  
  // Start data collection with optimized polling
  async startDataCollection(level = 'basic') {
    try {
      if (!this.connected || !this.initialized) {
        throw new Error('ZAKVOP adapter not connected or initialized');
      }
      
      // Determine parameters and interval based on level
      let parameters;
      let interval;
      
      switch (level) {
        case 'basic':
          parameters = ZAKVOP_POLLING_CONFIG.basicParameters.parameters;
          interval = ZAKVOP_POLLING_CONFIG.basicParameters.pollInterval;
          break;
        case 'extended':
          parameters = [
            ...ZAKVOP_POLLING_CONFIG.basicParameters.parameters,
            ...ZAKVOP_POLLING_CONFIG.extendedParameters.parameters
          ];
          interval = ZAKVOP_POLLING_CONFIG.extendedParameters.pollInterval;
          break;
        case 'advanced':
          parameters = [
            ...ZAKVOP_POLLING_CONFIG.basicParameters.parameters,
            ...ZAKVOP_POLLING_CONFIG.extendedParameters.parameters,
            ...ZAKVOP_POLLING_CONFIG.advancedParameters.parameters
          ];
          interval = ZAKVOP_POLLING_CONFIG.advancedParameters.pollInterval;
          break;
        default:
          parameters = ZAKVOP_POLLING_CONFIG.basicParameters.parameters;
          interval = ZAKVOP_POLLING_CONFIG.basicParameters.pollInterval;
      }
      
      // Convert parameters to format expected by OBD-II module
      const items = parameters.map(param => ({
        mode: param.mode,
        pid: param.pid
      }));
      
      // Start monitoring
      const started = await ObdWiFi.startContinuousMonitoring(items, interval);
      
      if (!started) {
        throw new Error('Failed to start continuous monitoring');
      }
      
      console.log(`Started ${level} data collection with interval ${interval}ms`);
      
      return true;
    } catch (error) {
      console.error('Error starting data collection:', error);
      if (this.onError) this.onError(error.message);
      return false;
    }
  }
  
  // Stop data collection
  async stopDataCollection() {
    try {
      await ObdWiFi.stopContinuousMonitoring();
      console.log('Stopped data collection');
      return true;
    } catch (error) {
      console.error('Error stopping data collection:', error);
      return false;
    }
  }
  
  // Clean up resources
  cleanup() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
}
```

## ZAKVOP-Specific Troubleshooting

Here are some troubleshooting tips specific to the ZAKVOP OBD2 scanner:

### Connection Issues

1. **WiFi Network Not Visible**:
   - Ensure the ZAKVOP scanner is properly plugged into the OBD-II port
   - Check that your vehicle's ignition is on
   - The scanner may take up to 30 seconds to create its WiFi network
   - Try unplugging and re-plugging the scanner

2. **Cannot Connect to WiFi Network**:
   - Verify you're connecting to the correct network (typically starts with "OBDII")
   - Try the default password: "12345678" (check your scanner documentation)
   - Restart your device's WiFi
   - Move closer to the scanner to improve signal strength

3. **Socket Connection Failures**:
   - Ensure you're using the correct IP address (typically 192.168.0.10)
   - Verify the correct port (typically 35000)
   - Check that no other device is currently connected to the scanner
   - Try restarting the scanner by unplugging it and plugging it back in

### Communication Issues

1. **Slow Response Times**:
   - The ZAKVOP scanner should respond quickly; if it's slow, try:
     - Resetting the adapter with the ATZ command
     - Checking for interference from other electronic devices
     - Ensuring the vehicle's battery is in good condition

2. **Intermittent Data**:
   - If data is inconsistent or intermittent:
     - Check for loose connection at the OBD-II port
     - Try a different polling rate
     - Reset the adapter and reinitialize

3. **Protocol Detection Issues**:
   - If the scanner has trouble detecting the protocol:
     - Try manually setting the protocol with the ATSP command
     - For most modern vehicles, try ATSP4 (CAN 11-bit, 500K)
     - For older vehicles, try ATSP1 (ISO9141-2)

### Implementation Example

Here's how to implement ZAKVOP-specific error handling:

```javascript
// ZAKVOP-specific error handler
function handleZakvopError(error, errorType) {
  // Log the error
  console.error(`ZAKVOP error (${errorType}):`, error);
  
  // Determine error type and provide specific guidance
  let errorMessage = 'Error communicating with ZAKVOP adapter.';
  let recoverySteps = [];
  
  switch (errorType) {
    case 'WIFI_CONNECTION':
      errorMessage = 'Cannot connect to ZAKVOP WiFi network.';
      recoverySteps = [
        'Ensure the ZAKVOP scanner is firmly plugged into the OBD-II port',
        'Check that your vehicle\'s ignition is on',
        'Wait 30 seconds for the scanner to initialize',
        'Look for a WiFi network starting with "OBDII"',
        'Try the default password: "12345678"'
      ];
      break;
      
    case 'SOCKET_CONNECTION':
      errorMessage = 'Cannot establish socket connection to ZAKVOP adapter.';
      recoverySteps = [
        'Ensure your device is connected to the ZAKVOP WiFi network',
        'Verify the IP address (typically 192.168.0.10) and port (typically 35000)',
        'Check that no other device is connected to the scanner',
        'Try unplugging and re-plugging the scanner'
      ];
      break;
      
    case 'PROTOCOL_DETECTION':
      errorMessage = 'ZAKVOP adapter cannot detect vehicle protocol.';
      recoverySteps = [
        'Ensure the vehicle\'s ignition is on',
        'Try manually setting the protocol with ATSP4 (for most modern vehicles)',
        'For older vehicles, try ATSP1',
        'Check that the scanner is compatible with your vehicle'
      ];
      break;
      
    case 'DATA_TIMEOUT':
      errorMessage = 'Timeout waiting for data from ZAKVOP adapter.';
      recoverySteps = [
        'Reset the adapter with the ATZ command',
        'Check for loose connection at the OBD-II port',
        'Ensure the vehicle\'s battery is in good condition',
        'Try a different polling rate'
      ];
      break;
      
    default:
      recoverySteps = [
        'Check that the ZAKVOP scanner is properly connected',
        'Ensure your device is connected to the scanner\'s WiFi network',
        'Try unplugging and re-plugging the scanner',
        'Restart the application'
      ];
  }
  
  // Display error to user with recovery steps
  Alert.alert(
    'ZAKVOP Connection Error',
    `${errorMessage}\n\nTry the following:\n${recoverySteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`,
    [
      { text: 'OK', style: 'cancel' }
    ]
  );
}
```

## ZAKVOP-Compatible App Example

Here's a simplified example of a React Native app specifically designed for the ZAKVOP OBD2 scanner:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Import custom components
import { ZakvopConnectionManager } from './ZakvopConnectionManager';
import { AIDiagnosticAssistant } from './AIDiagnosticAssistant';
import DiagnosticDashboard from './DiagnosticDashboard';

const ZakvopDiagnosticApp = () => {
  // State
  const [connectionState, setConnectionState] = useState('disconnected');
  const [vehicleData, setVehicleData] = useState({});
  const [adapterInfo, setAdapterInfo] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Initialize connection manager and assistant
  const [connectionManager] = useState(() => new ZakvopConnectionManager());
  const [assistant] = useState(() => new AIDiagnosticAssistant());
  
  // Set up connection manager event handlers
  useEffect(() => {
    connectionManager.onConnected = () => {
      setConnectionState('connected');
      getAdapterInfo();
    };
    
    connectionManager.onDisconnected = () => {
      setConnectionState('disconnected');
      setVehicleData({});
    };
    
    connectionManager.onInitialized = () => {
      setConnectionState('initialized');
      startDataCollection();
    };
    
    connectionManager.onError = (message) => {
      Alert.alert('Connection Error', message);
    };
    
    // Set up assistant data handler
    assistant.onDataUpdate = (data) => {
      setVehicleData(data.values);
    };
    
    // Clean up on unmount
    return () => {
      stopEverything();
      connectionManager.cleanup();
    };
  }, [connectionManager, assistant]);
  
  // Get adapter information
  const getAdapterInfo = async () => {
    const info = await connectionManager.getAdapterInfo();
    setAdapterInfo(info);
  };
  
  // Start data collection
  const startDataCollection = async () => {
    await assistant.start('extended');
  };
  
  // Connect to adapter
  const connectToAdapter = async () => {
    setLoading(true);
    
    try {
      // Check WiFi status
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected || netInfo.type !== 'wifi') {
        handleZakvopError(new Error('WiFi not connected'), 'WIFI_CONNECTION');
        setLoading(false);
        return;
      }
      
      // Check if connected to ZAKVOP WiFi
      if (netInfo.details && netInfo.details.ssid && !netInfo.details.ssid.startsWith('OBDII')) {
        Alert.alert(
          'Wrong WiFi Network',
          `You're connected to "${netInfo.details.ssid}" instead of the ZAKVOP network. Please connect to the ZAKVOP WiFi (typically starts with "OBDII").`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open WiFi Settings', 
              onPress: () => {
                // Open WiFi settings
                // On Android: IntentLauncher.startActivityAsync('android.settings.WIFI_SETTINGS')
                // On iOS: Linking.openURL('App-Prefs:root=WIFI')
              } 
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Connect to adapter
      await connectionManager.connect();
    } catch (error) {
      console.error('Error connecting to adapter:', error);
      Alert.alert('Connection Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Disconnect from adapter
  const disconnectFromAdapter = async () => {
    setLoading(true);
    
    try {
      await stopEverything();
    } catch (error) {
      console.error('Error disconnecting:', error);
      Alert.alert('Disconnect Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Stop everything
  const stopEverything = async () => {
    // Stop assistant
    await assistant.stop();
    
    // Disconnect from adapter
    await connectionManager.disconnect();
  };
  
  // Render connection screen
  const renderConnectionScreen = () => {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>ZAKVOP OBD-II AI Assistant</Text>
        <Text style={styles.subtitle}>Connect to your ZAKVOP OBD-II scanner</Text>
        
        <TouchableOpacity 
          style={styles.connectButton}
          onPress={connectToAdapter}
          disabled={loading || connectionState === 'connecting'}
        >
          <Text style={styles.connectButtonText}>Connect to ZAKVOP</Text>
        </TouchableOpacity>
        
        <Text style={styles.instructionText}>
          Make sure your ZAKVOP scanner is plugged into your vehicle's OBD-II port and your device is connected to the scanner's WiFi network.
        </Text>
      </View>
    );
  };
  
  // Render main screen
  const renderMainScreen = () => {
    return (
      <ScrollView style={styles.container}>
        {/* Adapter Info */}
        <View style={styles.adapterInfoContainer}>
          <Text style={styles.adapterInfoTitle}>ZAKVOP Scanner Info</Text>
          <Text style={styles.adapterInfoText}>Version: {adapterInfo.version}</Text>
          <Text style={styles.adapterInfoText}>Protocol: {adapterInfo.protocol}</Text>
          <Text style={styles.adapterInfoText}>Voltage: {adapterInfo.voltage}</Text>
        </View>
        
        {/* Diagnostic Dashboard */}
        <DiagnosticDashboard
          vehicleData={vehicleData}
          onRequestDiagnostic={() => assistant.runDiagnostics()}
          onAskQuestion={(question) => assistant.answerQuestion(question)}
        />
        
        {/* Disconnect Button */}
        <TouchableOpacity 
          style={styles.disconnectButton}
          onPress={disconnectFromAdapter}
          disabled={loading}
        >
          <Text style={styles.disconnectButtonText}>Disconnect from ZAKVOP</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {connectionState === 'initialized' ? renderMainScreen() : renderConnectionScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  container: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center'
  },
  connectButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  instructionText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666666',
    paddingHorizontal: 20
  },
  adapterInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  adapterInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  adapterInfoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default ZakvopDiagnosticApp;
```

## Performance Optimization for ZAKVOP

The ZAKVOP scanner's high-performance chip allows for several performance optimizations:

1. **Parallel Requests**: The ZAKVOP can handle multiple requests in quick succession, allowing for more efficient data collection:

```javascript
// Optimized multi-parameter request for ZAKVOP
async function getMultipleParameters(parameters) {
  try {
    // Create batch requests (ZAKVOP can handle quick successive requests)
    const promises = parameters.map(param => 
      ObdWiFi.sendPidRequest(param.mode, param.pid)
    );
    
    // Execute all requests in parallel
    const results = await Promise.all(promises);
    
    // Process results
    const processedResults = {};
    parameters.forEach((param, index) => {
      processedResults[param.name] = {
        value: parseParameterValue(param, results[index]),
        unit: param.unit,
        raw: results[index]
      };
    });
    
    return processedResults;
  } catch (error) {
    console.error('Error getting multiple parameters:', error);
    return {};
  }
}

// Parse parameter value based on parameter type
function parseParameterValue(parameter, rawValue) {
  // Implementation depends on parameter type
  // This is a simplified example
  
  if (!rawValue) return null;
  
  // Split response into parts
  const parts = rawValue.split(' ');
  
  // Check if response is valid
  const expectedMode = (parameter.mode + 0x40).toString(16).toUpperCase().padStart(2, '0');
  const expectedPid = parameter.pid.toString(16).padStart(2, '0').toUpperCase();
  
  if (parts.length < 3 || parts[0] !== expectedMode || parts[1] !== expectedPid) {
    return null;
  }
  
  // Parse based on parameter
  switch (parameter.name) {
    case 'RPM':
      if (parts.length >= 4) {
        const a = parseInt(parts[2], 16);
        const b = parseInt(parts[3], 16);
        return ((a * 256) + b) / 4;
      }
      break;
      
    case 'Speed':
      if (parts.length >= 3) {
        return parseInt(parts[2], 16);
      }
      break;
      
    case 'Coolant':
    case 'IntakeTemp':
      if (parts.length >= 3) {
        return parseInt(parts[2], 16) - 40;
      }
      break;
      
    case 'Load':
    case 'Throttle':
      if (parts.length >= 3) {
        return (parseInt(parts[2], 16) * 100) / 255;
      }
      break;
      
    // Add more parameter parsing as needed
      
    default:
      return rawValue;
  }
  
  return null;
}
```

2. **Faster DTC Reading**: The ZAKVOP can read DTCs in under 2 seconds, allowing for more frequent checks:

```javascript
// Optimized DTC reading for ZAKVOP
async function readDTCs() {
  try {
    // Send mode 03 command to get DTCs
    const response = await ObdWiFi.sendCommand('03');
    
    if (!response || response.includes('NO DATA')) {
      // No DTCs present
      return [];
    }
    
    // Parse DTCs
    const dtcs = [];
    const lines = response.split('\r');
    
    for (const line of lines) {
      if (line.startsWith('43')) {
        const parts = line.split(' ');
        
        // Process pairs of bytes (each DTC is 2 bytes)
        let i = 1; // Skip the "43" prefix
        while (i < parts.length - 1) {
          const firstByte = parseInt(parts[i], 16);
          const secondByte = parseInt(parts[i + 1], 16);
          
          // Skip if both bytes are 0 (no DTC)
          if (firstByte === 0 && secondByte === 0) {
            i += 2;
            continue;
          }
          
          // Extract DTC
          const dtc = decodeDTC(firstByte, secondByte);
          if (dtc) {
            dtcs.push(dtc);
          }
          
          i += 2;
        }
      }
    }
    
    return dtcs;
  } catch (error) {
    console.error('Error reading DTCs:', error);
    return [];
  }
}
```

3. **Faster Protocol Detection**: The ZAKVOP's quick protocol detection can be leveraged for faster initialization:

```javascript
// Optimized protocol detection for ZAKVOP
async function detectProtocol() {
  try {
    // Set auto protocol
    await ObdWiFi.sendCommand('ATSP0');
    
    // Send a simple request to trigger protocol detection
    await ObdWiFi.sendCommand('0100');
    
    // Get detected protocol
    const protocol = await ObdWiFi.sendCommand('ATDP');
    
    console.log('Detected protocol:', protocol);
    
    return protocol;
  } catch (error) {
    console.error('Error detecting protocol:', error);
    return null;
  }
}
```

By implementing these ZAKVOP-specific optimizations, you can create a React Native application that fully leverages the capabilities of the ZAKVOP OBD2 scanner, providing a fast and responsive user experience.

In the next section, we'll explore testing and debugging strategies for your OBD-II application.
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
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

export function info(message, data) {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    console.log(`[INFO] ${message}`, data || '');
  }
}

export function warn(message, data) {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    console.warn(`[WARN] ${message}`, data || '');
  }
}

export function error(message, error) {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    console.error(`[ERROR] ${message}`, error || '');
  }
}
```

2. **Create a Debug Screen**:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button } from 'react-native';
import debugCommands from '../ObdWiFiDebug';

const DebugScreen = () => {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [connectionDetails, setConnectionDetails] = useState({});
  
  // Get connection details on mount
  useEffect(() => {
    getConnectionDetails();
  }, []);
  
  // Get connection details
  const getConnectionDetails = async () => {
    const details = await debugCommands.getConnectionDetails();
    setConnectionDetails(details);
  };
  
  // Send raw command
  const sendCommand = async () => {
    if (!command) return;
    
    const result = await debugCommands.sendRawCommand(command);
    setResponse(result);
  };
  
  // Get internal state
  const getInternalState = async () => {
    const state = await debugCommands.getInternalState();
    setResponse(state);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OBD-II Debug Console</Text>
      
      {/* Connection Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Details</Text>
        {typeof connectionDetails === 'string' ? (
          <Text>{connectionDetails}</Text>
        ) : (
          <>
            <Text>Protocol: {connectionDetails.protocol || 'Unknown'}</Text>
            <Text>Voltage: {connectionDetails.voltage || 'Unknown'}</Text>
            <Text>Version: {connectionDetails.version || 'Unknown'}</Text>
          </>
        )}
        <Button title="Refresh" onPress={getConnectionDetails} />
      </View>
      
      {/* Command Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Raw Command</Text>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          placeholder="Enter command (e.g., ATZ, 0100)"
        />
        <Button title="Send" onPress={sendCommand} />
      </View>
      
      {/* Internal State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Internal State</Text>
        <Button title="Get Internal State" onPress={getInternalState} />
      </View>
      
      {/* Response */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Response</Text>
        <ScrollView style={styles.responseContainer}>
          <Text>{response}</Text>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8
  },
  responseContainer: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    padding: 8,
    height: 200
  }
});

export default DebugScreen;
```

## Performance Optimization

Optimize your application for better performance with OBD-II communication.

### Batch Processing

Instead of sending individual commands, batch them for efficiency:

```javascript
// Batch processing example
async function batchProcessCommands(commands) {
  const results = {};
  
  // Process commands in batches of 5
  const batchSize = 5;
  
  for (let i = 0; i < commands.length; i += batchSize) {
    const batch = commands.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(cmd => {
      return ObdWiFi.sendCommand(cmd)
        .then(response => ({ cmd, response }))
        .catch(error => ({ cmd, error: error.message }));
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Store results
    batchResults.forEach(result => {
      results[result.cmd] = result.response || result.error;
    });
  }
  
  return results;
}
```

### Prioritize Critical Data

Prioritize critical data for more responsive updates:

```javascript
// Data priority manager
class DataPriorityManager {
  constructor() {
    // Define priority levels
    this.priorities = {
      HIGH: {
        parameters: [
          { mode: 0x01, pid: 0x0C, name: 'RPM' },      // Engine RPM
          { mode: 0x01, pid: 0x0D, name: 'Speed' },    // Vehicle speed
          { mode: 0x01, pid: 0x05, name: 'Coolant' }   // Coolant temperature
        ],
        interval: 500 // 500ms
      },
      MEDIUM: {
        parameters: [
          { mode: 0x01, pid: 0x04, name: 'Load' },     // Engine load
          { mode: 0x01, pid: 0x11, name: 'Throttle' }, // Throttle position
          { mode: 0x01, pid: 0x0F, name: 'IntakeTemp' }// Intake temperature
        ],
        interval: 1000 // 1000ms
      },
      LOW: {
        parameters: [
          { mode: 0x01, pid: 0x10, name: 'MAF' },      // MAF air flow
          { mode: 0x01, pid: 0x0B, name: 'MAP' },      // Intake pressure
          { mode: 0x01, pid: 0x2F, name: 'FuelLevel' } // Fuel level
        ],
        interval: 5000 // 5000ms
      }
    };
    
    // Timers
    this.timers = {};
    
    // Data callback
    this.onDataReceived = null;
  }
  
  // Start monitoring with priority
  startMonitoring() {
    // Start high priority monitoring
    this.timers.high = setInterval(() => {
      this.fetchParameters(this.priorities.HIGH.parameters);
    }, this.priorities.HIGH.interval);
    
    // Start medium priority monitoring
    this.timers.medium = setInterval(() => {
      this.fetchParameters(this.priorities.MEDIUM.parameters);
    }, this.priorities.MEDIUM.interval);
    
    // Start low priority monitoring
    this.timers.low = setInterval(() => {
      this.fetchParameters(this.priorities.LOW.parameters);
    }, this.priorities.LOW.interval);
  }
  
  // Stop monitoring
  stopMonitoring() {
    Object.values(this.timers).forEach(timer => {
      clearInterval(timer);
    });
    
    this.timers = {};
  }
  
  // Fetch parameters
  async fetchParameters(parameters) {
    try {
      // Convert parameters to format expected by OBD-II module
      const items = parameters.map(param => ({
        mode: param.mode,
        pid: param.pid
      }));
      
      // Get values
      const values = await ObdWiFi.getMultipleSensorValues(items);
      
      // Process values
      const processedValues = {};
      
      parameters.forEach(param => {
        const key = `${param.mode}:${param.pid}`;
        if (values[key] !== undefined) {
          processedValues[param.name] = values[key];
        }
      });
      
      // Notify callback
      if (this.onDataReceived) {
        this.onDataReceived(processedValues);
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
    }
  }
}
```

By implementing these testing and debugging strategies, you can ensure your OBD-II application is reliable, performant, and provides a great user experience across different vehicles and conditions.

In the next section, we'll explore deployment and distribution strategies for your OBD-II application.
# 14. Deployment and Distribution

This section covers strategies for deploying and distributing your React Native OBD-II application to users.

## Building for Production

Before distributing your application, you need to prepare it for production deployment.

### Android Production Build

To build your Android application for production:

1. **Update Version Information**:
   
   In `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           applicationId "com.yourdomain.obdapp"
           versionCode 1
           versionName "1.0.0"
           // ...
       }
       // ...
   }
   ```

2. **Generate a Signing Key**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Configure Signing in Gradle**:
   
   Create `android/app/gradle.properties` (if it doesn't exist):
   ```
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=*****
   MYAPP_RELEASE_KEY_PASSWORD=*****
   ```

   Update `android/app/build.gradle`:
   ```gradle
   android {
       // ...
       signingConfigs {
           release {
               storeFile file(MYAPP_RELEASE_STORE_FILE)
               storePassword MYAPP_RELEASE_STORE_PASSWORD
               keyAlias MYAPP_RELEASE_KEY_ALIAS
               keyPassword MYAPP_RELEASE_KEY_PASSWORD
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               // ...
           }
       }
   }
   ```

4. **Build Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. **Test the Release Build**:
   ```bash
   npx react-native run-android --variant=release
   ```

### iOS Production Build

To build your iOS application for production:

1. **Update Version Information**:
   
   In Xcode, select your project, go to the "General" tab, and update the "Version" and "Build" fields.

2. **Configure Signing**:
   
   In Xcode, select your project, go to the "Signing & Capabilities" tab, and configure your signing certificate and provisioning profile.

3. **Create an Archive**:
   
   In Xcode, select "Product" > "Archive" from the menu.

4. **Validate and Distribute**:
   
   In the Xcode Organizer, select your archive and click "Validate App" and then "Distribute App".

## App Store Distribution

To distribute your application through app stores:

### Google Play Store

1. **Create a Developer Account**:
   
   Sign up for a Google Play Developer account at [play.google.com/apps/publish](https://play.google.com/apps/publish).

2. **Prepare Store Listing**:
   
   Create your app listing with:
   - App title and description
   - Screenshots and feature graphic
   - Promotional video (optional)
   - Content rating
   - Privacy policy

3. **Upload APK or App Bundle**:
   
   Upload your signed APK or Android App Bundle (AAB) file.

4. **Set Pricing and Distribution**:
   
   Configure pricing, countries, and device compatibility.

5. **Submit for Review**:
   
   Submit your app for Google's review process.

### Apple App Store

1. **Create a Developer Account**:
   
   Sign up for an Apple Developer account at [developer.apple.com](https://developer.apple.com).

2. **Create an App Record in App Store Connect**:
   
   Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and create a new app record.

3. **Prepare Store Listing**:
   
   Configure your app listing with:
   - App name and description
   - Screenshots and app preview videos
   - Keywords
   - Support URL and privacy policy

4. **Upload Build**:
   
   Upload your build from Xcode or using Application Loader.

5. **Submit for Review**:
   
   Complete the submission form and submit your app for Apple's review process.

## Alternative Distribution Methods

For specialized applications like OBD-II diagnostics, you might consider alternative distribution methods:

### Direct APK Distribution

For Android, you can distribute your app directly as an APK file:

1. **Host the APK File**:
   
   Upload your signed APK to a file hosting service or your own website.

2. **Create an Installation Page**:
   
   Create a webpage with installation instructions and a download link.

3. **Enable Unknown Sources**:
   
   Instruct users to enable "Install from Unknown Sources" in their device settings.

4. **QR Code for Easy Access**:
   
   Generate a QR code that links to your APK download for easy access.

### Enterprise Distribution

For business or enterprise use:

1. **Android Enterprise**:
   
   Use Google Play's private app distribution or managed Google Play.

2. **Apple Business Manager**:
   
   Use Apple Business Manager for enterprise app distribution.

3. **Mobile Device Management (MDM)**:
   
   Deploy your app through an MDM solution like Microsoft Intune or VMware Workspace ONE.

## Marketing Your OBD-II App

To reach your target audience effectively:

1. **Identify Your Audience**:
   
   - DIY car enthusiasts
   - Professional mechanics
   - Fleet managers
   - Car owners concerned about vehicle health

2. **Create a Landing Page**:
   
   Develop a dedicated website that:
   - Explains your app's features and benefits
   - Shows screenshots and videos of the app in action
   - Provides compatibility information
   - Offers download links or store links

3. **Content Marketing**:
   
   Create valuable content such as:
   - Blog posts about car diagnostics
   - YouTube tutorials on using OBD-II scanners
   - Infographics explaining check engine light codes
   - Guides to improving vehicle performance

4. **Social Media Presence**:
   
   Establish a presence on:
   - Facebook groups for car enthusiasts
   - Reddit communities like r/MechanicAdvice or r/cars
   - Instagram with visual content of the app in action
   - Twitter for quick tips and updates

5. **Partnerships**:
   
   Partner with:
   - OBD-II scanner manufacturers
   - Auto parts retailers
   - Car maintenance shops
   - Automotive YouTubers and influencers

## Monetization Strategies

Consider these monetization approaches for your OBD-II app:

1. **Freemium Model**:
   
   - Free basic version with essential features
   - Premium version with advanced diagnostics and AI features
   - In-app purchases for specific feature sets

2. **Subscription Model**:
   
   - Monthly or annual subscription for full access
   - Different tiers based on feature sets
   - Free trial period to demonstrate value

3. **One-Time Purchase**:
   
   - Single payment for the full app
   - Optional add-ons for specialized features
   - Discounted upgrade path for future major versions

4. **Feature-Based Pricing**:
   
   - Basic diagnostics for free
   - Pay for AI diagnostic assistant
   - Pay for advanced sensor monitoring
   - Pay for repair guidance

## User Support and Feedback

Providing excellent support is crucial for specialized technical apps:

1. **In-App Support**:
   
   - Comprehensive help section
   - Troubleshooting guides
   - FAQ for common issues
   - Direct support contact form

2. **Community Building**:
   
   - User forums for peer support
   - Discord server for real-time help
   - Regular webinars for power users
   - Feature request voting system

3. **Continuous Improvement**:
   
   - Regular updates based on user feedback
   - Beta testing program for enthusiasts
   - Changelog communications
   - Roadmap sharing for upcoming features

4. **Vehicle Compatibility Database**:
   
   - Crowdsourced compatibility information
   - User reports on working/non-working vehicles
   - Searchable database by make, model, and year
   - Compatibility ratings and notes

By implementing these deployment, distribution, and marketing strategies, you can successfully bring your OBD-II application to market and build a loyal user base of car enthusiasts and professionals who value your tool for vehicle diagnostics and maintenance.

In the next section, we'll provide a comprehensive conclusion and summary of the entire guide.
# 15. Conclusion and Next Steps

This comprehensive guide has walked you through the complete process of creating a React Native native module for WiFi OBD-II communication with AI diagnostic capabilities, specifically optimized for the ZAKVOP OBD2 scanner.

## Summary of What We've Covered

We've explored the following key areas:

1. **Introduction and Core Concepts**:
   - Why native modules are necessary for OBD-II communication
   - The architecture of React Native Turbo Modules
   - OBD-II protocols and communication principles

2. **Technical Implementation**:
   - Setting up the module specification with Codegen
   - Implementing the native module for Android (Java/Kotlin)
   - Implementing the native module for iOS (Swift/Objective-C)
   - Managing WiFi connections to OBD-II adapters
   - Implementing support for all seven OBD-II protocols
   - Handling errors and edge cases

3. **AI Diagnostic Assistant**:
   - Designing the architecture for an AI-powered diagnostic system
   - Collecting and processing vehicle data
   - Implementing diagnostic algorithms
   - Integrating with language models for natural language diagnostics
   - Creating an intuitive user interface

4. **ZAKVOP-Specific Optimizations**:
   - Configuring the application for the ZAKVOP OBD2 scanner
   - Optimizing data polling rates for faster performance
   - Implementing ZAKVOP-specific error handling
   - Creating a specialized connection manager

5. **Testing, Deployment, and Distribution**:
   - Setting up a testing environment with OBD-II simulators
   - Implementing unit and integration tests
   - Debugging strategies for native and JavaScript code
   - Building for production and distributing through app stores
   - Marketing and monetization strategies

## Key Takeaways

As you implement your OBD-II application, keep these key principles in mind:

1. **Robust Error Handling**: OBD-II communication can be unpredictable due to varying vehicle implementations, adapter quality, and environmental factors. Comprehensive error handling is essential for a good user experience.

2. **Performance Optimization**: Balance between data freshness and system performance. Not all parameters need to be updated at the same frequency.

3. **User-Friendly Diagnostics**: Technical vehicle data should be translated into actionable insights that non-experts can understand and act upon.

4. **Cross-Platform Consistency**: Ensure a consistent experience across both Android and iOS platforms while respecting platform-specific best practices.

5. **Continuous Testing**: Regularly test with different vehicles and conditions to ensure broad compatibility.

## Next Steps and Future Enhancements

As you complete your initial implementation, consider these potential enhancements:

1. **Expanded Vehicle Coverage**:
   - Support for manufacturer-specific PIDs
   - Enhanced compatibility with hybrid and electric vehicles
   - Support for CAN bus monitoring beyond standard OBD-II

2. **Advanced AI Features**:
   - Predictive maintenance alerts
   - Personalized driving efficiency recommendations
   - Integration with vehicle service history

3. **Community Features**:
   - Crowdsourced vehicle compatibility database
   - Shared diagnostic experiences
   - Expert mechanic marketplace integration

4. **Hardware Expansion**:
   - Support for additional OBD-II adapter types (Bluetooth, USB)
   - Integration with external sensors
   - Support for multiple simultaneous vehicle connections

5. **Integration Possibilities**:
   - Navigation app integration for trip logging
   - Fuel price integration for cost analysis
   - Insurance telematics integration

## Final Thoughts

Creating a React Native native module for OBD-II communication is a complex but rewarding endeavor. By following this guide, you've gained the knowledge to build a sophisticated vehicle diagnostic application that leverages the power of modern mobile devices and artificial intelligence.

Your application has the potential to empower users with insights about their vehicles that were previously only available to professional mechanics. By making this technology accessible and user-friendly, you're contributing to safer, more efficient, and better-maintained vehicles on the road.

Remember that the automotive technology landscape is constantly evolving, so stay informed about new OBD-II standards, vehicle communication protocols, and diagnostic techniques to keep your application at the cutting edge.

Good luck with your implementation, and happy coding!
# 1. Introduction: Creating an AI Vehicle Assistant with React Native OBD-II WiFi Module

## Purpose of This Guide

This comprehensive guide aims to walk you through the process of creating a cross-platform AI vehicle assistant application that connects to an OBD-II adapter via WiFi. The guide focuses specifically on implementing a custom React Native native module that can communicate with the ZAKVOP OBD2 scanner, which supports all OBD-II protocols and offers WiFi connectivity.

By the end of this guide, you'll have a fully functional React Native application that can:
- Connect to your ZAKVOP OBD2 scanner via WiFi
- Communicate using all 7 OBD-II protocols
- Read diagnostic trouble codes (DTCs) and clear them
- Access live sensor data from your vehicle
- Leverage AI to help diagnose vehicle issues

## Overview of the AI Vehicle Assistant Concept

The AI vehicle assistant we're building combines several powerful technologies:

1. **OBD-II Communication**: The On-Board Diagnostics II (OBD-II) standard allows access to your vehicle's diagnostic data, sensor readings, and control systems.

2. **React Native**: A cross-platform framework that lets you build mobile applications for both Android and iOS using JavaScript/TypeScript.

3. **Native Modules**: Custom native code (Java/Kotlin for Android, Swift/Objective-C for iOS) that extends React Native's capabilities to interact with hardware like the OBD-II adapter.

4. **Artificial Intelligence**: Algorithms that can analyze vehicle data, identify patterns, and provide diagnostic insights in human-readable form.

The application will serve as a smart intermediary between the driver and the vehicle's complex systems. When a check engine light appears or the vehicle exhibits unusual behavior, the assistant can retrieve relevant data, analyze it, and provide actionable insights about potential issues, maintenance needs, or performance optimizations.

## Why Native Modules Are Necessary for OBD-II Communication

React Native provides a powerful JavaScript environment for building cross-platform applications, but it has limitations when it comes to low-level hardware communication. For OBD-II communication via WiFi, we need to:

1. **Establish TCP Socket Connections**: Most WiFi OBD-II adapters (including the ZAKVOP) operate as TCP servers on a specific IP address and port. React Native's JavaScript environment doesn't provide direct socket APIs.

2. **Handle Binary Data**: OBD-II communication often involves binary data processing, which is more efficiently handled in native code.

3. **Manage Connection States**: Reliable connection management requires background threads and state handling that's better implemented in native code.

4. **Optimize Performance**: OBD-II communication can involve high-frequency data polling (for real-time parameters like RPM, speed, etc.), which benefits from the performance of native code.

5. **Support Multiple Protocols**: The ZAKVOP scanner supports all 7 OBD-II protocols, requiring protocol-specific handling that's more manageable in native code.

By creating a custom native module, we bridge the gap between React Native's JavaScript environment and the low-level networking capabilities needed for reliable OBD-II communication.

## Benefits of Using the Turbo Modules Approach

React Native has evolved its native module architecture over time. The modern approach, called "Turbo Modules" (part of the new architecture), offers several advantages over the older "Bridge" approach:

1. **Type Safety**: Turbo Modules use a code generation approach ("Codegen") that ensures type consistency between JavaScript and native code, reducing runtime errors.

2. **Performance**: Turbo Modules use the JavaScript Interface (JSI) for direct communication between JavaScript and native code, eliminating serialization/deserialization overhead.

3. **Lazy Loading**: Modules are loaded only when needed, improving startup performance.

4. **Specification-First Development**: The TypeScript specification serves as the single source of truth for the module's interface, ensuring consistency across platforms.

5. **Future-Proofing**: As React Native continues to evolve, Turbo Modules represent the recommended path forward for native module development.

For our OBD-II communication module, these benefits translate to more reliable vehicle data retrieval, faster response times for diagnostic queries, and a more maintainable codebase as the application evolves.

In the next section, we'll cover the prerequisites needed before diving into the implementation details.
# 2. Prerequisites: Setting Up Your Development Environment

Before diving into the implementation of our AI vehicle assistant with OBD-II WiFi connectivity, it's essential to ensure you have the right tools, knowledge, and environment set up. This section covers everything you need to get started.

## React Native Development Environment

Our application will be built using React Native, which requires a properly configured development environment:

1. **Node.js and npm/yarn**: 
   - Install Node.js (version 14.0.0 or newer)
   - We recommend using yarn for package management, but npm works as well

2. **React Native CLI**: 
   - Install the React Native Command Line Interface globally:
   ```bash
   npm install -g react-native-cli
   # or
   yarn global add react-native-cli
   ```

3. **Development IDE**: 
   - Visual Studio Code is recommended with the following extensions:
     - React Native Tools
     - ESLint
     - TypeScript support
     - Prettier (for code formatting)

4. **Project Initialization**:
   - We'll be using the React Native CLI approach (not Expo) since we need to work with native modules:
   ```bash
   npx react-native init OBDAssistant --template react-native-template-typescript
   ```

## Native Development Basics

Since we're creating a native module, you'll need basic familiarity with native development environments for both platforms:

### Android Development Requirements:

1. **Android Studio**: Latest stable version
2. **Android SDK**: API level 21 (Android 5.0) or higher
3. **Java Development Kit (JDK)**: Version 11 or newer
4. **Kotlin**: Our native code will be written in Kotlin (preferred over Java)
5. **Android Virtual Device (AVD)** or a physical Android device for testing

### iOS Development Requirements:

1. **macOS**: Required for iOS development
2. **Xcode**: Latest stable version
3. **CocoaPods**: For dependency management
4. **Swift**: Our native code will be written in Swift (preferred over Objective-C)
5. **iOS Simulator** or a physical iOS device for testing

## OBD-II and ELM327 Fundamentals

To effectively work with OBD-II communication, you should understand these key concepts:

1. **OBD-II Basics**:
   - OBD-II (On-Board Diagnostics II) is a standardized system that provides access to various vehicle subsystems.
   - All vehicles sold in the United States since 1996 are required to support OBD-II.
   - The standard defines a physical connector (the OBD-II port, typically located under the dashboard) and communication protocols.

2. **OBD-II Protocols**:
   - Different vehicle manufacturers use different protocols. The ZAKVOP scanner supports all 7 OBD-II protocols:
     1. ISO9141-2 (5 baud init, 10.4 Kbaud)
     2. ISO14230-4 KWP (5 baud init, 10.4 Kbaud)
     3. ISO14230-4 KWP (fast init, 10.4 Kbaud)
     4. ISO15765-4 CAN (11-bit ID, 500 Kbaud)
     5. ISO15765-4 CAN (29-bit ID, 500 Kbaud)
     6. ISO15765-4 CAN (11-bit ID, 250 Kbaud)
     7. ISO15765-4 CAN (29-bit ID, 250 Kbaud)
   - The protocol used depends on the vehicle make, model, and year.

3. **ELM327 Interface**:
   - The ELM327 is a microcontroller that serves as an interpreter between OBD-II protocols and standard interfaces like WiFi, Bluetooth, or USB.
   - Most aftermarket OBD-II adapters (including the ZAKVOP) use the ELM327 or compatible chipsets.
   - Communication with an ELM327 involves sending AT commands (for adapter configuration) and OBD-II PIDs (Parameter IDs for requesting specific data).

4. **Common AT Commands**:
   - `ATZ`: Reset the adapter
   - `ATE0`: Turn echo off (don't repeat commands back)
   - `ATL0`: Turn linefeeds off
   - `ATH1`: Show header information
   - `ATSP0`: Set protocol to auto (let the adapter determine the protocol)
   - `ATDP`: Display current protocol

5. **OBD-II PIDs (Parameter IDs)**:
   - PIDs are codes used to request specific data from a vehicle's control modules.
   - Format: Mode (1 byte) + PID (1 byte)
   - Common modes:
     - Mode 01: Show current data
     - Mode 02: Show freeze frame data
     - Mode 03: Show stored DTCs (Diagnostic Trouble Codes)
     - Mode 04: Clear DTCs and stored values
     - Mode 09: Request vehicle information
   - Examples:
     - `010C`: Request engine RPM (Mode 01, PID 0C)
     - `0105`: Request engine coolant temperature (Mode 01, PID 05)
     - `03`: Request DTCs (Mode 03, no PID needed)

## ZAKVOP OBD2 Scanner Specifications

The ZAKVOP OBD2 scanner has specific capabilities that we'll leverage in our application:

1. **Connectivity**:
   - WiFi connection (primary focus of this guide)
   - Bluetooth connection (alternative option)

2. **Protocol Support**:
   - Supports all 7 OBD-II protocols as listed above
   - Works with all 1996 and newer OBD-II compliant vehicles (gasoline and 12V diesel)

3. **Performance**:
   - Fast read speeds (reads codes within 1.9 seconds)
   - Quick fault code clearing (within 3.8 seconds)

4. **Compatibility**:
   - Works with Android devices
   - Works with Windows PCs
   - Compatible with apps like "Torque" (which we'll reference for some functionality)

5. **Features**:
   - Read and clear diagnostic trouble codes
   - Check emissions system readiness
   - Access live sensor data (O2 sensors, fuel pressure, engine load, etc.)
   - View freeze frame data

## Node.js & npm/yarn

For the JavaScript/TypeScript portion of our development:

1. **Node.js**: Ensure you have Node.js installed (version 14.0.0 or newer)
2. **Package Manager**: Either npm (comes with Node.js) or yarn
3. **TypeScript**: We'll use TypeScript for type safety and better developer experience

With these prerequisites in place, you're ready to begin implementing the OBD-II WiFi module and AI vehicle assistant. In the next section, we'll explore the core concepts behind Turbo Modules and OBD-II communication in more detail.
# 3. Core Concepts: Understanding Turbo Modules and OBD-II Communication

This section explores the fundamental concepts behind React Native Turbo Modules and OBD-II communication, providing the theoretical foundation needed for our implementation.

## Turbo Modules & Codegen Explanation

### Evolution of React Native Native Modules

React Native's approach to native modules has evolved significantly:

1. **The Legacy Bridge Architecture**:
   - Used a serialization/deserialization process to communicate between JavaScript and native code
   - All data passed through a single bridge, creating potential bottlenecks
   - Required manual interface definition on both JavaScript and native sides
   - Runtime errors occurred if interfaces didn't match
   - Synchronous native methods blocked the JavaScript thread

2. **The New Architecture with Turbo Modules**:
   - Uses JavaScript Interface (JSI) for direct communication between JavaScript and native code
   - Eliminates serialization/deserialization overhead
   - Supports synchronous methods without blocking the JS thread
   - Uses code generation ("Codegen") to ensure interface consistency
   - Provides better type safety and build-time validation

### How Codegen Works

Codegen is a core part of the Turbo Modules approach:

1. **Specification File**: You define your module's interface in TypeScript, including methods, parameters, and return types.

2. **Code Generation Process**:
   - During the build process, React Native's Codegen reads your TypeScript specification
   - It generates native interface files:
     - Java/Kotlin interfaces for Android
     - Objective-C/Swift protocols for iOS

3. **Implementation**: You implement these generated interfaces in your native code.

4. **Type Safety**: The generated interfaces ensure that your native implementation matches the JavaScript expectations, catching mismatches at build time rather than runtime.

### Benefits for OBD-II Communication

For our OBD-II module, Turbo Modules offer several advantages:

1. **Performance**: Direct communication is crucial for real-time vehicle data.
2. **Reliability**: Type safety reduces the risk of crashes due to mismatched interfaces.
3. **Maintainability**: The TypeScript specification serves as a single source of truth.
4. **Future-Proofing**: Aligns with React Native's architectural direction.

## OBD-II Protocols Supported by ZAKVOP

The ZAKVOP OBD2 scanner supports all seven OBD-II protocols, each with specific characteristics:

### 1. ISO9141-2 (5 baud init, 10.4 Kbaud)
- Used primarily in older European and Asian vehicles
- Slower initialization process (5 baud)
- Communication speed of 10.4 Kbaud
- Characteristics:
  - Single-wire bidirectional communication
  - Requires specific timing for message transmission
  - Often requires longer timeouts

### 2. ISO14230-4 KWP (5 baud init, 10.4 Kbaud)
- Keyword Protocol 2000 with slow initialization
- Used in various European and Asian vehicles
- Similar to ISO9141-2 but with different message structure
- Characteristics:
  - More flexible message length
  - Supports more diagnostic services
  - Requires specific initialization sequence

### 3. ISO14230-4 KWP (fast init, 10.4 Kbaud)
- Same as above but with faster initialization
- Reduces connection establishment time
- Characteristics:
  - Faster startup sequence
  - Same protocol capabilities as slow-init KWP
  - More responsive initial connection

### 4. ISO15765-4 CAN (11-bit ID, 500 Kbaud)
- Controller Area Network protocol with standard addressing
- Mandatory for all US vehicles since 2008
- High-speed communication (500 Kbaud)
- Characteristics:
  - Robust error detection
  - Prioritized message transmission
  - Efficient for real-time data

### 5. ISO15765-4 CAN (29-bit ID, 500 Kbaud)
- CAN protocol with extended addressing
- Allows more unique message identifiers
- Same speed as standard CAN
- Characteristics:
  - Supports more complex networks
  - Used in some newer vehicle systems
  - Same fundamental protocol as 11-bit CAN

### 6. ISO15765-4 CAN (11-bit ID, 250 Kbaud)
- Medium-speed CAN with standard addressing
- Used in some vehicle subsystems
- Characteristics:
  - Lower bandwidth than 500 Kbaud
  - Often used for non-critical systems
  - Same message format as high-speed CAN

### 7. ISO15765-4 CAN (29-bit ID, 250 Kbaud)
- Medium-speed CAN with extended addressing
- Least common among the CAN variants
- Characteristics:
  - Combines extended addressing with medium speed
  - Used in specialized vehicle systems
  - Same fundamental protocol as other CAN variants

### Protocol Auto-Detection

The ZAKVOP scanner, like most ELM327-based devices, can automatically detect which protocol your vehicle uses. This is typically done by:

1. Sending the `ATSP0` command (Set Protocol to Auto)
2. Attempting a standard OBD-II request (like `0100` - supported PIDs)
3. The adapter tries each protocol until it receives a valid response
4. Once determined, the adapter can report the active protocol with the `ATDP` command

In our implementation, we'll leverage this auto-detection capability while also providing options for manual protocol selection if needed.

## WiFi Communication Principles with OBD Adapters

Understanding how WiFi OBD adapters work is crucial for our implementation:

### Network Configuration

1. **Access Point Mode**:
   - Most WiFi OBD adapters (including ZAKVOP) operate as WiFi access points
   - They create their own WiFi network with an SSID (often starting with "OBDII" or similar)
   - Default IP address is typically 192.168.0.10 or 192.168.0.1
   - Default port is often 35000 for TCP connections

2. **Connection Process**:
   - The mobile device connects to the OBD adapter's WiFi network
   - The application establishes a TCP socket connection to the adapter's IP and port
   - Once connected, communication occurs via standard TCP socket operations

### Communication Protocol

1. **Command Structure**:
   - Commands are sent as ASCII strings
   - Each command typically ends with a carriage return character (`\r`)
   - Example: `010C\r` to request engine RPM

2. **Response Format**:
   - Responses are also ASCII strings
   - Multiple lines may be returned for a single command
   - Responses typically end with a prompt character (`>`)
   - Example response to `010C\r`:
     ```
     010C
     41 0C 1A F8
     >
     ```

3. **Data Flow**:
   - Commands are sent synchronously (wait for response before sending next command)
   - Responses may be fragmented (received in multiple TCP packets)
   - Some commands (like continuous monitoring) can produce ongoing responses

4. **Connection Management**:
   - The connection should be maintained as long as communication is needed
   - Idle timeouts may occur if no commands are sent for extended periods
   - Reconnection logic is essential for robust operation

### Performance Considerations

1. **Command Timing**:
   - Different commands have different response times
   - Some vehicle systems respond more slowly than others
   - Timeout handling is crucial for reliability

2. **Data Polling Rate**:
   - Real-time parameters (like RPM) may need frequent polling
   - Excessive polling can overwhelm some adapters or vehicle networks
   - Finding the right balance is important for performance

3. **Connection Stability**:
   - WiFi signal strength affects reliability
   - Background processing ensures continuous operation
   - Error recovery mechanisms are essential

## AI Diagnostic Principles and Implementation Approach

Our AI vehicle assistant will combine OBD-II data with intelligent analysis:

### Diagnostic Data Collection

1. **Relevant Parameters**:
   - Diagnostic Trouble Codes (DTCs)
   - Freeze frame data (vehicle conditions when a DTC was set)
   - Live sensor data (multiple parameters)
   - Readiness monitors status

2. **Data Preprocessing**:
   - Converting raw values to meaningful units
   - Filtering noise and invalid readings
   - Normalizing data for analysis

### Diagnostic Approaches

1. **Rule-Based Diagnostics**:
   - Predefined rules for common issues
   - DTC lookup and interpretation
   - Parameter threshold monitoring
   - Symptom-cause mapping

2. **Pattern Recognition**:
   - Identifying abnormal sensor patterns
   - Correlating multiple parameters
   - Detecting intermittent issues

3. **Natural Language Processing**:
   - Converting technical data to human-readable insights
   - Responding to user queries about vehicle status
   - Explaining complex issues in simple terms

### Implementation Strategy

1. **Layered Architecture**:
   - Data collection layer (OBD-II module)
   - Data processing layer (parameter conversion and validation)
   - Analysis layer (diagnostic algorithms)
   - Presentation layer (user interface and natural language generation)

2. **Incremental Intelligence**:
   - Start with basic rule-based diagnostics
   - Add pattern recognition capabilities
   - Integrate with language models for natural interaction
   - Continuously improve based on feedback and new data

In the next section, we'll define the TypeScript specification for our OBD-II module, which will serve as the foundation for our implementation.
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
# 5. Configuring Codegen

This section explains how to configure React Native's Codegen to process our TypeScript specification and generate the necessary native interface files for both Android and iOS.

## Package.json Setup

The first step is to configure your package.json file to tell Codegen about your module. This configuration will be used during the build process to generate the appropriate native interfaces.

```json
{
  "name": "react-native-obd-wifi",
  "version": "0.1.0",
  "description": "React Native module for OBD-II WiFi communication with AI diagnostic capabilities",
  "main": "lib/commonjs/index",
  "module": "lib/module/index",
  "types": "lib/typescript/index.d.ts",
  "react-native": "src/index",
  "source": "src/index",
  "files": [
    "src",
    "lib",
    "android",
    "ios",
    "cpp",
    "*.podspec",
    "!lib/typescript/example",
    "!ios/build",
    "!android/build",
    "!android/gradle",
    "!android/gradlew",
    "!android/gradlew.bat",
    "!android/local.properties",
    "!**/__tests__",
    "!**/__fixtures__",
    "!**/__mocks__",
    "!**/.*"
  ],
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint \"**/*.{js,ts,tsx}\"",
    "prepack": "bob build",
    "release": "release-it",
    "example": "yarn --cwd example",
    "bootstrap": "yarn example && yarn install"
  },
  "keywords": [
    "react-native",
    "ios",
    "android",
    "obd",
    "obd2",
    "obdii",
    "elm327",
    "car",
    "vehicle",
    "diagnostic",
    "wifi",
    "ai"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/react-native-obd-wifi.git"
  },
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/yourusername/react-native-obd-wifi/issues"
  },
  "homepage": "https://github.com/yourusername/react-native-obd-wifi#readme",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/"
  },
  "devDependencies": {
    "@commitlint/config-conventional": "^17.0.2",
    "@evilmartians/lefthook": "^1.2.2",
    "@react-native-community/eslint-config": "^3.0.2",
    "@release-it/conventional-changelog": "^5.0.0",
    "@types/jest": "^28.1.2",
    "@types/react": "~17.0.21",
    "@types/react-native": "0.70.0",
    "commitlint": "^17.0.2",
    "del-cli": "^5.0.0",
    "eslint": "^8.4.1",
    "eslint-config-prettier": "^8.5.0",
    "eslint-plugin-prettier": "^4.0.0",
    "jest": "^28.1.1",
    "pod-install": "^0.1.0",
    "prettier": "^2.0.5",
    "react": "18.2.0",
    "react-native": "0.71.0",
    "react-native-builder-bob": "^0.20.0",
    "release-it": "^15.0.0",
    "typescript": "^4.5.2"
  },
  "resolutions": {
    "@types/react": "17.0.21"
  },
  "peerDependencies": {
    "react": "*",
    "react-native": "*"
  },
  "engines": {
    "node": ">= 16.0.0"
  },
  "packageManager": "^yarn@1.22.15",
  "jest": {
    "preset": "react-native",
    "modulePathIgnorePatterns": [
      "<rootDir>/example/node_modules",
      "<rootDir>/lib/"
    ]
  },
  "commitlint": {
    "extends": [
      "@commitlint/config-conventional"
    ]
  },
  "release-it": {
    "git": {
      "commitMessage": "chore: release ${version}",
      "tagName": "v${version}"
    },
    "npm": {
      "publish": true
    },
    "github": {
      "release": true
    },
    "plugins": {
      "@release-it/conventional-changelog": {
        "preset": "angular"
      }
    }
  },
  "eslintConfig": {
    "root": true,
    "extends": [
      "@react-native-community",
      "prettier"
    ],
    "rules": {
      "prettier/prettier": [
        "error",
        {
          "quoteProps": "consistent",
          "singleQuote": true,
          "tabWidth": 2,
          "trailingComma": "es5",
          "useTabs": false
        }
      ]
    }
  },
  "eslintIgnore": [
    "node_modules/",
    "lib/"
  ],
  "prettier": {
    "quoteProps": "consistent",
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "useTabs": false
  },
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      "commonjs",
      "module",
      [
        "typescript",
        {
          "project": "tsconfig.build.json"
        }
      ]
    ]
  },
  "codegenConfig": {
    "name": "RTNObdWiFiSpec",
    "type": "modules",
    "jsSrcsDir": "src/native",
    "android": {
      "javaPackageName": "com.obdwifi"
    }
  }
}
```

The most important part for Codegen is the `codegenConfig` section:

```json
"codegenConfig": {
  "name": "RTNObdWiFiSpec",
  "type": "modules",
  "jsSrcsDir": "src/native",
  "android": {
    "javaPackageName": "com.obdwifi"
  }
}
```

- `name`: The library name for Codegen artifacts
- `type`: Set to "modules" for Turbo Modules
- `jsSrcsDir`: Directory containing our TypeScript specification file
- `android.javaPackageName`: Java package name for generated Android files

## Module Registration

Next, we need to create the main JavaScript entry point for our module. This file will export the native module interface for use in React Native applications.

Create a file at `src/index.ts`:

```typescript
import { NativeEventEmitter } from 'react-native';
import NativeObdWiFi from './native/NativeObdWiFi';

// Re-export types for consumers
export type {
  ObdConnectionConfig,
  ObdDataEvent,
  ObdDiagnosticCode,
} from './native/NativeObdWiFi';

// Check if the native module is available
if (!NativeObdWiFi) {
  throw new Error('RTNObdWiFi native module is not available');
}

// Create an event emitter for the native module
const eventEmitter = new NativeEventEmitter(NativeObdWiFi as any);

// Define the event name constant
const OBD_WIFI_EVENT = 'ObdWiFiEvent';

// Create a class wrapper around the native module for easier use
class ObdWiFi {
  /**
   * Connect to the OBD-II WiFi adapter.
   * @param config Connection configuration
   * @returns Promise resolving to true on successful connection
   */
  static connect(config: Parameters<typeof NativeObdWiFi.connect>[0]) {
    return NativeObdWiFi.connect(config);
  }

  /**
   * Disconnect from the OBD-II adapter.
   * @returns Promise resolving to true on successful disconnection
   */
  static disconnect() {
    return NativeObdWiFi.disconnect();
  }

  /**
   * Check if connected to the OBD-II adapter.
   * @returns Promise resolving to true if connected
   */
  static isConnected() {
    return NativeObdWiFi.isConnected();
  }

  /**
   * Get the current connection status.
   * @returns Promise resolving to connection status details
   */
  static getConnectionStatus() {
    return NativeObdWiFi.getConnectionStatus();
  }

  /**
   * Send a raw command to the OBD-II adapter.
   * @param command Command string
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving to true if command was sent successfully
   */
  static sendCommand(command: string, timeoutMs?: number) {
    return NativeObdWiFi.sendCommand(command, timeoutMs);
  }

  /**
   * Send an OBD-II PID request.
   * @param mode OBD-II mode
   * @param pid OBD-II PID (can be null for modes that don't require a PID)
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving to the raw response string
   */
  static sendPidRequest(mode: number, pid: number | null, timeoutMs?: number) {
    return NativeObdWiFi.sendPidRequest(mode, pid, timeoutMs);
  }

  /**
   * Initialize the OBD-II connection with standard setup commands.
   * @returns Promise resolving to true if initialization was successful
   */
  static initializeConnection() {
    return NativeObdWiFi.initializeConnection();
  }

  /**
   * Read diagnostic trouble codes from the vehicle.
   * @returns Promise resolving to an array of diagnostic codes
   */
  static readDiagnosticCodes() {
    return NativeObdWiFi.readDiagnosticCodes();
  }

  /**
   * Clear diagnostic trouble codes and turn off the MIL.
   * @returns Promise resolving to true if codes were cleared successfully
   */
  static clearDiagnosticCodes() {
    return NativeObdWiFi.clearDiagnosticCodes();
  }

  /**
   * Check if the vehicle is ready for emissions testing.
   * @returns Promise resolving to readiness status
   */
  static getEmissionsReadiness() {
    return NativeObdWiFi.getEmissionsReadiness();
  }

  /**
   * Get the current engine RPM.
   * @returns Promise resolving to the current RPM or null if unavailable
   */
  static getEngineRPM() {
    return NativeObdWiFi.getEngineRPM();
  }

  /**
   * Get the vehicle speed in km/h.
   * @returns Promise resolving to the current speed or null if unavailable
   */
  static getVehicleSpeed() {
    return NativeObdWiFi.getVehicleSpeed();
  }

  /**
   * Get the engine coolant temperature in Celsius.
   * @returns Promise resolving to the current temperature or null if unavailable
   */
  static getCoolantTemperature() {
    return NativeObdWiFi.getCoolantTemperature();
  }

  /**
   * Get multiple sensor values in a single call.
   * @param items Array of sensor items to retrieve (mode and PID pairs)
   * @returns Promise resolving to an object with the requested values
   */
  static getMultipleSensorValues(
    items: Parameters<typeof NativeObdWiFi.getMultipleSensorValues>[0]
  ) {
    return NativeObdWiFi.getMultipleSensorValues(items);
  }

  /**
   * Start continuous monitoring of specified parameters.
   * @param items Array of parameters to monitor (mode and PID pairs)
   * @param intervalMs Polling interval in milliseconds
   * @returns Promise resolving to true if monitoring started successfully
   */
  static startContinuousMonitoring(
    items: Parameters<typeof NativeObdWiFi.startContinuousMonitoring>[0],
    intervalMs: number
  ) {
    return NativeObdWiFi.startContinuousMonitoring(items, intervalMs);
  }

  /**
   * Stop continuous monitoring.
   * @returns Promise resolving to true if monitoring was stopped successfully
   */
  static stopContinuousMonitoring() {
    return NativeObdWiFi.stopContinuousMonitoring();
  }

  /**
   * Get vehicle identification number (VIN).
   * @returns Promise resolving to the VIN string or null if unavailable
   */
  static getVehicleVIN() {
    return NativeObdWiFi.getVehicleVIN();
  }

  /**
   * Get supported PIDs for a specific mode.
   * @param mode OBD-II mode (typically 01 for current data)
   * @returns Promise resolving to an array of supported PIDs
   */
  static getSupportedPIDs(mode: number) {
    return NativeObdWiFi.getSupportedPIDs(mode);
  }

  /**
   * Add a listener for OBD-II events.
   * @param callback Function to call when an event is received
   * @returns Subscription object that can be used to remove the listener
   */
  static addListener(callback: (event: any) => void) {
    // Tell the native module we're adding a listener
    NativeObdWiFi.addListener(OBD_WIFI_EVENT);
    
    // Return the actual event subscription
    return eventEmitter.addListener(OBD_WIFI_EVENT, callback);
  }

  /**
   * Remove all listeners for OBD-II events.
   */
  static removeAllListeners() {
    const count = eventEmitter.listenerCount(OBD_WIFI_EVENT);
    if (count > 0) {
      NativeObdWiFi.removeListeners(count);
      eventEmitter.removeAllListeners(OBD_WIFI_EVENT);
    }
  }
}

export default ObdWiFi;
```

This wrapper class provides a more convenient interface for JavaScript consumers while delegating to the native module for actual implementation.

## Installation & Linking

### For Development Within Your App

If you're developing this module within your main app project, you'll need to ensure the native build process finds your module code.

#### Android Setup

1. Add the module to `android/settings.gradle`:

```gradle
include ':react-native-obd-wifi'
project(':react-native-obd-wifi').projectDir = new File(rootProject.projectDir, '../path/to/module/android')
```

2. Add the module to your app's dependencies in `android/app/build.gradle`:

```gradle
dependencies {
    // ... other dependencies
    implementation project(':react-native-obd-wifi')
}
```

3. Add the package to your `MainApplication.java`:

```java
import com.obdwifi.ObdWiFiPackage; // Import the package

// Inside the getPackages method
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new ObdWiFiPackage()); // Add the package
    return packages;
}
```

#### iOS Setup

1. Add the module to your Podfile:

```ruby
pod 'react-native-obd-wifi', :path => '../path/to/module'
```

2. Run `pod install` in the iOS directory:

```bash
cd ios && pod install
```

### For Use as a Separate Library

If you're building this as a separate library for others to use:

1. Create the appropriate directory structure:

```
react-native-obd-wifi/
├── android/
├── ios/
├── src/
│   ├── index.ts
│   └── native/
│       └── NativeObdWiFi.ts
├── package.json
├── README.md
└── tsconfig.json
```

2. Users would install it via npm/yarn:

```bash
npm install react-native-obd-wifi
# or
yarn add react-native-obd-wifi
```

3. React Native's autolinking should handle most of the setup automatically.

## Codegen Execution

The native build process (Gradle for Android, Xcode for iOS) will automatically run Codegen during the build, generating necessary interface files in the build directories.

For Android, the generated files will be in:
```
android/app/build/generated/source/codegen/java/com/obdwifi/
```

For iOS, the generated files will be in:
```
ios/build/generated/ios/
```

These generated files will include the native interfaces that your implementation must conform to.

In the next sections, we'll implement these interfaces for both Android and iOS platforms.
# 6. Android Implementation

This section provides a detailed implementation of the OBD-II WiFi module for Android using Kotlin. We'll create the necessary classes to handle socket communication, protocol management, and event emission.

## Module Implementation

Let's start by implementing the main module class that conforms to the generated interface from Codegen.

Create a file at `android/src/main/java/com/obdwifi/ObdWiFiModule.kt`:

```kotlin
package com.obdwifi

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.net.InetSocketAddress
import java.net.Socket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = ObdWiFiModule.NAME)
class ObdWiFiModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext),
    NativeObdWiFiSpec {

    companion object {
        const val NAME = "RTNObdWiFi"
        const val EVENT_NAME = "ObdWiFiEvent"
        
        // OBD-II Protocol constants
        const val PROTOCOL_AUTO = 0
        const val PROTOCOL_ISO9141_5BAUD = 1
        const val PROTOCOL_ISO14230_5BAUD = 2
        const val PROTOCOL_ISO14230_FAST = 3
        const val PROTOCOL_ISO15765_11BIT_500K = 4
        const val PROTOCOL_ISO15765_29BIT_500K = 5
        const val PROTOCOL_ISO15765_11BIT_250K = 6
        const val PROTOCOL_ISO15765_29BIT_250K = 7
        
        // Default timeouts
        const val DEFAULT_CONNECTION_TIMEOUT = 10000 // 10 seconds
        const val DEFAULT_RESPONSE_TIMEOUT = 5000 // 5 seconds
        
        // Command terminators
        const val COMMAND_TERMINATOR = "\r"
        const val RESPONSE_PROMPT = ">"
    }

    // Coroutine scope for background tasks
    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    // Socket and connection variables
    private var socket: Socket? = null
    private var reader: BufferedReader? = null
    private var writer: PrintWriter? = null
    private val isConnected = AtomicBoolean(false)
    private val isInitialized = AtomicBoolean(false)
    
    // Connection configuration
    private var ipAddress: String = ""
    private var port: Int = 0
    private var autoConnect: Boolean = false
    private var connectionTimeout: Int = DEFAULT_CONNECTION_TIMEOUT
    private var responseTimeout: Int = DEFAULT_RESPONSE_TIMEOUT
    private var protocol: Int = PROTOCOL_AUTO
    
    // Continuous monitoring
    private var monitoringJob: Job? = null
    private val monitoringItems = mutableListOf<Map<String, Int>>()
    private var monitoringInterval: Int = 1000 // Default 1 second
    
    // DTC database (simplified for this example)
    private val dtcDatabase = ConcurrentHashMap<String, Pair<String, String>>()
    
    // Event listener count
    private var listenerCount = 0

    init {
        // Initialize DTC database with some common codes
        initializeDtcDatabase()
    }

    override fun getName(): String = NAME

    // --- Connection Methods ---

    override fun connect(config: ReadableMap, promise: Promise) {
        try {
            // Extract configuration
            ipAddress = config.getString("ipAddress") ?: ""
            port = config.getDouble("port").toInt()
            autoConnect = config.getBoolean("autoConnect")
            connectionTimeout = config.getDouble("connectionTimeout").toInt()
            responseTimeout = config.getDouble("responseTimeout").toInt()
            protocol = if (config.hasKey("protocol")) config.getDouble("protocol").toInt() else PROTOCOL_AUTO
            
            if (ipAddress.isEmpty() || port <= 0) {
                promise.reject("INVALID_CONFIG", "Invalid IP address or port")
                return
            }
            
            // Disconnect if already connected
            if (isConnected.get()) {
                disconnect(Promise { /* ignore result */ })
            }
            
            // Connect in background
            moduleScope.launch {
                try {
                    // Create socket and connect
                    val newSocket = Socket()
                    newSocket.connect(InetSocketAddress(ipAddress, port), connectionTimeout)
                    
                    // Create reader and writer
                    val newReader = BufferedReader(InputStreamReader(newSocket.getInputStream()))
                    val newWriter = PrintWriter(newSocket.getOutputStream(), true)
                    
                    // Store references
                    socket = newSocket
                    reader = newReader
                    writer = newWriter
                    isConnected.set(true)
                    isInitialized.set(false)
                    
                    // Send connection event
                    sendEvent("connection", "Connected to $ipAddress:$port", null)
                    
                    // Start reading responses in background
                    startResponseReader()
                    
                    // Resolve promise on main thread
                    withContext(Dispatchers.Main) {
                        promise.resolve(true)
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "Connection error", e)
                    sendEvent("error", "Connection failed: ${e.message}", null)
                    
                    // Clean up resources
                    closeConnection()
                    
                    // Reject promise on main thread
                    withContext(Dispatchers.Main) {
                        promise.reject("CONNECTION_ERROR", e.message, e)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(NAME, "Connect error", e)
            promise.reject("UNEXPECTED_ERROR", e.message, e)
        }
    }

    override fun disconnect(promise: Promise) {
        moduleScope.launch {
            try {
                // Stop monitoring if active
                stopContinuousMonitoring(Promise { /* ignore result */ })
                
                // Close connection
                closeConnection()
                
                // Send event
                sendEvent("connection", "Disconnected", null)
                
                // Resolve promise on main thread
                withContext(Dispatchers.Main) {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Disconnect error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("DISCONNECT_ERROR", e.message, e)
                }
            }
        }
    }

    override fun isConnected(promise: Promise) {
        promise.resolve(isConnected.get())
    }

    override fun getConnectionStatus(promise: Promise) {
        val status = Arguments.createMap().apply {
            putBoolean("connected", isConnected.get())
            if (isConnected.get()) {
                putString("ipAddress", ipAddress)
                putDouble("port", port.toDouble())
                putDouble("protocol", protocol.toDouble())
                putString("protocolName", getProtocolName(protocol))
                // We would track connection time in a real implementation
                putDouble("elapsedTimeMs", 0.0)
            }
        }
        promise.resolve(status)
    }

    // --- Command Methods ---

    override fun sendCommand(command: String, timeoutMs: Double?, promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        val timeout = timeoutMs?.toInt() ?: responseTimeout
        
        moduleScope.launch {
            try {
                // Send command
                val fullCommand = command + COMMAND_TERMINATOR
                writer?.println(fullCommand)
                writer?.flush()
                
                // Log command
                Log.d(NAME, "Sent command: $command")
                sendEvent("log", "Sent: $command", null)
                
                // Resolve promise on main thread
                withContext(Dispatchers.Main) {
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Send command error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("COMMAND_ERROR", e.message, e)
                }
            }
        }
    }

    override fun sendPidRequest(mode: Double, pid: Double?, timeoutMs: Double?, promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        val modeInt = mode.toInt()
        val pidInt = pid?.toInt()
        val timeout = timeoutMs?.toInt() ?: responseTimeout
        
        moduleScope.launch {
            try {
                // Build command
                val command = if (pidInt != null) {
                    String.format("%02X%02X", modeInt, pidInt)
                } else {
                    String.format("%02X", modeInt)
                }
                
                // Create response collector
                val responseCollector = ResponseCollector(timeout.toLong())
                
                // Register collector
                synchronized(responseCollectors) {
                    responseCollectors[command] = responseCollector
                }
                
                // Send command
                writer?.println(command + COMMAND_TERMINATOR)
                writer?.flush()
                
                // Log command
                Log.d(NAME, "Sent PID request: $command")
                sendEvent("log", "Sent PID: $command", null)
                
                // Wait for response
                val response = responseCollector.waitForResponse()
                
                // Unregister collector
                synchronized(responseCollectors) {
                    responseCollectors.remove(command)
                }
                
                // Check for timeout
                if (response == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("TIMEOUT", "Command timed out: $command")
                    }
                    return@launch
                }
                
                // Resolve with response
                withContext(Dispatchers.Main) {
                    promise.resolve(response)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Send PID request error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("PID_ERROR", e.message, e)
                }
            }
        }
    }

    // --- Diagnostic Methods ---

    override fun initializeConnection(promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        moduleScope.launch {
            try {
                // Send initialization commands
                val commands = listOf(
                    "ATZ",      // Reset
                    "ATE0",     // Echo off
                    "ATL0",     // Linefeeds off
                    "ATH1",     // Headers on
                    "ATS0",     // Spaces off
                    "ATSP${protocol}" // Set protocol
                )
                
                var success = true
                
                for (command in commands) {
                    // Create response collector
                    val responseCollector = ResponseCollector(responseTimeout.toLong())
                    
                    // Register collector
                    synchronized(responseCollectors) {
                        responseCollectors[command] = responseCollector
                    }
                    
                    // Send command
                    writer?.println(command + COMMAND_TERMINATOR)
                    writer?.flush()
                    
                    // Log command
                    Log.d(NAME, "Init command: $command")
                    sendEvent("log", "Init: $command", null)
                    
                    // Wait for response
                    val response = responseCollector.waitForResponse()
                    
                    // Unregister collector
                    synchronized(responseCollectors) {
                        responseCollectors.remove(command)
                    }
                    
                    // Check for timeout
                    if (response == null) {
                        success = false
                        sendEvent("error", "Initialization command timed out: $command", null)
                        break
                    }
                }
                
                // Set initialized flag
                isInitialized.set(success)
                
                // Send event
                if (success) {
                    sendEvent("status", "OBD adapter initialized", null)
                } else {
                    sendEvent("error", "OBD adapter initialization failed", null)
                }
                
                // Resolve promise on main thread
                withContext(Dispatchers.Main) {
                    promise.resolve(success)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Initialization error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("INIT_ERROR", e.message, e)
                }
            }
        }
    }

    override fun readDiagnosticCodes(promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        moduleScope.launch {
            try {
                // Create response collector
                val responseCollector = ResponseCollector(responseTimeout.toLong())
                
                // Register collector
                synchronized(responseCollectors) {
                    responseCollectors["03"] = responseCollector
                }
                
                // Send command to get DTCs
                writer?.println("03" + COMMAND_TERMINATOR)
                writer?.flush()
                
                // Log command
                Log.d(NAME, "Reading DTCs")
                sendEvent("log", "Reading DTCs", null)
                
                // Wait for response
                val response = responseCollector.waitForResponse()
                
                // Unregister collector
                synchronized(responseCollectors) {
                    responseCollectors.remove("03")
                }
                
                // Check for timeout
                if (response == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("TIMEOUT", "DTC request timed out")
                    }
                    return@launch
                }
                
                // Parse DTCs
                val dtcs = parseDTCs(response)
                
                // Create result array
                val resultArray = Arguments.createArray()
                
                for (dtc in dtcs) {
                    val dtcInfo = dtcDatabase[dtc]
                    val dtcMap = Arguments.createMap().apply {
                        putString("code", dtc)
                        putString("description", dtcInfo?.first ?: "Unknown code")
                        putString("severity", dtcInfo?.second ?: "unknown")
                    }
                    resultArray.pushMap(dtcMap)
                }
                
                // Resolve with DTCs
                withContext(Dispatchers.Main) {
                    promise.resolve(resultArray)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Read DTCs error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("DTC_ERROR", e.message, e)
                }
            }
        }
    }

    override fun clearDiagnosticCodes(promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        moduleScope.launch {
            try {
                // Create response collector
                val responseCollector = ResponseCollector(responseTimeout.toLong())
                
                // Register collector
                synchronized(responseCollectors) {
                    responseCollectors["04"] = responseCollector
                }
                
                // Send command to clear DTCs
                writer?.println("04" + COMMAND_TERMINATOR)
                writer?.flush()
                
                // Log command
                Log.d(NAME, "Clearing DTCs")
                sendEvent("log", "Clearing DTCs", null)
                
                // Wait for response
                val response = responseCollector.waitForResponse()
                
                // Unregister collector
                synchronized(responseCollectors) {
                    responseCollectors.remove("04")
                }
                
                // Check for timeout
                if (response == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("TIMEOUT", "Clear DTCs request timed out")
                    }
                    return@launch
                }
                
                // Check if successful
                val success = response.contains("44") || response.contains("OK")
                
                // Send event
                if (success) {
                    sendEvent("status", "DTCs cleared successfully", null)
                } else {
                    sendEvent("error", "Failed to clear DTCs", null)
                }
                
                // Resolve with success
                withContext(Dispatchers.Main) {
                    promise.resolve(success)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Clear DTCs error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("CLEAR_DTC_ERROR", e.message, e)
                }
            }
        }
    }

    override fun getEmissionsReadiness(promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        moduleScope.launch {
            try {
                // Create response collector
                val responseCollector = ResponseCollector(responseTimeout.toLong())
                
                // Register collector
                synchronized(responseCollectors) {
                    responseCollectors["0101"] = responseCollector
                }
                
                // Send command to get readiness status
                writer?.println("0101" + COMMAND_TERMINATOR)
                writer?.flush()
                
                // Log command
                Log.d(NAME, "Checking emissions readiness")
                sendEvent("log", "Checking emissions readiness", null)
                
                // Wait for response
                val response = responseCollector.waitForResponse()
                
                // Unregister collector
                synchronized(responseCollectors) {
                    responseCollectors.remove("0101")
                }
                
                // Check for timeout
                if (response == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("TIMEOUT", "Readiness check timed out")
                    }
                    return@launch
                }
                
                // Parse readiness status
                val (ready, incompleteTests) = parseReadinessStatus(response)
                
                // Create result
                val result = Arguments.createMap().apply {
                    putBoolean("ready", ready)
                    putArray("incompleteTests", Arguments.fromList(incompleteTests))
                }
                
                // Resolve with readiness status
                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Readiness check error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("READINESS_ERROR", e.message, e)
                }
            }
        }
    }

    // --- Data Retrieval Methods ---

    override fun getEngineRPM(promise: Promise) {
        getSingleSensorValue(0x01, 0x0C, "RPM") { response ->
            if (response != null && response.isNotEmpty()) {
                try {
                    // Parse RPM from response
                    // Format: 41 0C XX YY where RPM = ((256*XX) + YY) / 4
                    val parts = response.split(" ")
                    if (parts.size >= 4) {
                        val a = parts[2].toInt(16)
                        val b = parts[3].toInt(16)
                        val rpm = ((a * 256) + b) / 4.0
                        rpm
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "RPM parsing error", e)
                    null
                }
            } else {
                null
            }
        }.let { promise.resolve(it) }
    }

    override fun getVehicleSpeed(promise: Promise) {
        getSingleSensorValue(0x01, 0x0D, "Speed") { response ->
            if (response != null && response.isNotEmpty()) {
                try {
                    // Parse speed from response
                    // Format: 41 0D XX where speed = XX in km/h
                    val parts = response.split(" ")
                    if (parts.size >= 3) {
                        val speed = parts[2].toInt(16).toDouble()
                        speed
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "Speed parsing error", e)
                    null
                }
            } else {
                null
            }
        }.let { promise.resolve(it) }
    }

    override fun getCoolantTemperature(promise: Promise) {
        getSingleSensorValue(0x01, 0x05, "Coolant Temperature") { response ->
            if (response != null && response.isNotEmpty()) {
                try {
                    // Parse temperature from response
                    // Format: 41 05 XX where temperature = XX - 40 in Celsius
                    val parts = response.split(" ")
                    if (parts.size >= 3) {
                        val temp = parts[2].toInt(16) - 40.0
                        temp
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    Log.e(NAME, "Temperature parsing error", e)
                    null
                }
            } else {
                null
            }
        }.let { promise.resolve(it) }
    }

    override fun getMultipleSensorValues(items: ReadableArray, promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        moduleScope.launch {
            try {
                val result = Arguments.createMap()
                
                for (i in 0 until items.size()) {
                    val item = items.getMap(i)
                    val mode = item.getDouble("mode").toInt()
                    val pid = item.getDouble("pid").toInt()
                    
                    // Create command
                    val command = String.format("%02X%02X", mode, pid)
                    
                    // Create response collector
                    val responseCollector = ResponseCollector(responseTimeout.toLong())
                    
                    // Register collector
                    synchronized(responseCollectors) {
                        responseCollectors[command] = responseCollector
                    }
                    
                    // Send command
                    writer?.println(command + COMMAND_TERMINATOR)
                    writer?.flush()
                    
                    // Log command
                    Log.d(NAME, "Multi-sensor request: $command")
                    
                    // Wait for response
                    val response = responseCollector.waitForResponse()
                    
                    // Unregister collector
                    synchronized(responseCollectors) {
                        responseCollectors.remove(command)
                    }
                    
                    // Parse response
                    val value = parseOBDResponse(mode, pid, response)
                    
                    // Add to result
                    val key = "$mode:$pid"
                    if (value is Double) {
                        result.putDouble(key, value)
                    } else if (value is String) {
                        result.putString(key, value)
                    } else if (value is Boolean) {
                        result.putBoolean(key, value)
                    } else {
                        result.putNull(key)
                    }
                }
                
                // Resolve with result
                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Multi-sensor error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("SENSOR_ERROR", e.message, e)
                }
            }
        }
    }

    // --- Continuous Monitoring ---

    override fun startContinuousMonitoring(items: ReadableArray, intervalMs: Double, promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        // Stop existing monitoring
        stopContinuousMonitoring(Promise { /* ignore result */ })
        
        // Convert items to list
        val itemsList = mutableListOf<Map<String, Int>>()
        for (i in 0 until items.size()) {
            val item = items.getMap(i)
            val mode = item.getDouble("mode").toInt()
            val pid = item.getDouble("pid").toInt()
            itemsList.add(mapOf("mode" to mode, "pid" to pid))
        }
        
        // Store monitoring parameters
        monitoringItems.clear()
        monitoringItems.addAll(itemsList)
        monitoringInterval = intervalMs.toInt()
        
        // Start monitoring job
        monitoringJob = moduleScope.launch {
            try {
                while (isActive && isConnected.get()) {
                    val result = Arguments.createMap()
                    result.putDouble("timestamp", System.currentTimeMillis().toDouble())
                    
                    for (item in monitoringItems) {
                        val mode = item["mode"] ?: continue
                        val pid = item["pid"] ?: continue
                        
                        // Create command
                        val command = String.format("%02X%02X", mode, pid)
                        
                        // Create response collector
                        val responseCollector = ResponseCollector(responseTimeout.toLong())
                        
                        // Register collector
                        synchronized(responseCollectors) {
                            responseCollectors[command] = responseCollector
                        }
                        
                        // Send command
                        writer?.println(command + COMMAND_TERMINATOR)
                        writer?.flush()
                        
                        // Wait for response
                        val response = responseCollector.waitForResponse()
                        
                        // Unregister collector
                        synchronized(responseCollectors) {
                            responseCollectors.remove(command)
                        }
                        
                        // Parse response
                        val value = parseOBDResponse(mode, pid, response)
                        
                        // Add to result
                        val key = "$mode:$pid"
                        if (value is Double) {
                            result.putDouble(key, value)
                        } else if (value is String) {
                            result.putString(key, value)
                        } else if (value is Boolean) {
                            result.putBoolean(key, value)
                        } else {
                            result.putNull(key)
                        }
                    }
                    
                    // Send event with data
                    val eventData = Arguments.createMap().apply {
                        putMap("values", result)
                    }
                    sendEvent("data", "Monitoring data", eventData)
                    
                    // Delay for interval
                    delay(monitoringInterval.toLong())
                }
            } catch (e: Exception) {
                Log.e(NAME, "Monitoring error", e)
                sendEvent("error", "Monitoring error: ${e.message}", null)
            }
        }
        
        // Resolve promise
        promise.resolve(true)
    }

    override fun stopContinuousMonitoring(promise: Promise) {
        // Cancel monitoring job
        monitoringJob?.cancel()
        monitoringJob = null
        
        // Clear monitoring parameters
        monitoringItems.clear()
        
        // Send event
        sendEvent("status", "Monitoring stopped", null)
        
        // Resolve promise
        promise.resolve(true)
    }

    // --- Vehicle Information ---

    override fun getVehicleVIN(promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        moduleScope.launch {
            try {
                // Create response collector
                val responseCollector = ResponseCollector(responseTimeout.toLong())
                
                // Register collector
                synchronized(responseCollectors) {
                    responseCollectors["0902"] = responseCollector
                }
                
                // Send command to get VIN
                writer?.println("0902" + COMMAND_TERMINATOR)
                writer?.flush()
                
                // Log command
                Log.d(NAME, "Requesting VIN")
                sendEvent("log", "Requesting VIN", null)
                
                // Wait for response
                val response = responseCollector.waitForResponse()
                
                // Unregister collector
                synchronized(responseCollectors) {
                    responseCollectors.remove("0902")
                }
                
                // Check for timeout
                if (response == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("TIMEOUT", "VIN request timed out")
                    }
                    return@launch
                }
                
                // Parse VIN
                val vin = parseVIN(response)
                
                // Resolve with VIN
                withContext(Dispatchers.Main) {
                    promise.resolve(vin)
                }
            } catch (e: Exception) {
                Log.e(NAME, "VIN request error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("VIN_ERROR", e.message, e)
                }
            }
        }
    }

    override fun getSupportedPIDs(mode: Double, promise: Promise) {
        if (!isConnected.get()) {
            promise.reject("NOT_CONNECTED", "Not connected to OBD adapter")
            return
        }
        
        val modeInt = mode.toInt()
        
        moduleScope.launch {
            try {
                val supportedPIDs = mutableListOf<Int>()
                
                // Request supported PIDs in ranges (00, 20, 40, 60, ...)
                val ranges = listOf(0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0)
                
                for (range in ranges) {
                    // Create command
                    val command = String.format("%02X%02X", modeInt, range)
                    
                    // Create response collector
                    val responseCollector = ResponseCollector(responseTimeout.toLong())
                    
                    // Register collector
                    synchronized(responseCollectors) {
                        responseCollectors[command] = responseCollector
                    }
                    
                    // Send command
                    writer?.println(command + COMMAND_TERMINATOR)
                    writer?.flush()
                    
                    // Log command
                    Log.d(NAME, "Requesting supported PIDs: $command")
                    
                    // Wait for response
                    val response = responseCollector.waitForResponse()
                    
                    // Unregister collector
                    synchronized(responseCollectors) {
                        responseCollectors.remove(command)
                    }
                    
                    // Check for timeout or no response
                    if (response == null || !response.contains(" ")) {
                        continue
                    }
                    
                    // Parse supported PIDs
                    val pids = parseSupportedPIDs(modeInt, range, response)
                    supportedPIDs.addAll(pids)
                    
                    // Check if we should continue to next range
                    if (!pids.contains(range + 0x20)) {
                        break
                    }
                }
                
                // Create result array
                val resultArray = Arguments.createArray()
                for (pid in supportedPIDs) {
                    resultArray.pushDouble(pid.toDouble())
                }
                
                // Resolve with supported PIDs
                withContext(Dispatchers.Main) {
                    promise.resolve(resultArray)
                }
            } catch (e: Exception) {
                Log.e(NAME, "Supported PIDs error", e)
                
                // Reject promise on main thread
                withContext(Dispatchers.Main) {
                    promise.reject("PID_SUPPORT_ERROR", e.message, e)
                }
            }
        }
    }

    // --- Event Handling ---

    override fun addListener(eventName: String) {
        // Increment listener count
        listenerCount++
        
        // Log
        Log.d(NAME, "Added listener: $eventName, count: $listenerCount")
    }

    override fun removeListeners(count: Double) {
        // Decrement listener count
        listenerCount -= count.toInt()
        if (listenerCount < 0) {
            listenerCount = 0
        }
        
        // Log
        Log.d(NAME, "Removed listeners: ${count.toInt()}, count: $listenerCount")
        
        // If no listeners remain, consider stopping continuous monitoring
        if (listenerCount == 0) {
            stopContinuousMonitoring(Promise { /* ignore result */ })
        }
    }

    // --- Helper Methods ---

    private fun sendEvent(type: String, message: String, data: ReadableMap?) {
        if (!reactApplicationContext.hasActiveCatalystInstance()) {
            return
        }
        
        val event = Arguments.createMap().apply {
            putDouble("timestamp", System.currentTimeMillis().toDouble())
            putString("type", type)
            putString("message", message)
            if (data != null) {
                putMap("data", data)
            }
        }
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NAME, event)
    }

    private fun closeConnection() {
        try {
            writer?.close()
            reader?.close()
            socket?.close()
        } catch (e: Exception) {
            Log.e(NAME, "Error closing connection", e)
        } finally {
            writer = null
            reader = null
            socket = null
            isConnected.set(false)
            isInitialized.set(false)
        }
    }

    private fun startResponseReader() {
        moduleScope.launch {
            try {
                val localReader = reader ?: return@launch
                
                val buffer = StringBuilder()
                var currentCommand: String? = null
                
                while (isActive && isConnected.get()) {
                    try {
                        // Check if reader is available
                        if (!localReader.ready()) {
                            delay(10)
                            continue
                        }
                        
                        // Read a character
                        val c = localReader.read().toChar()
                        
                        // Add to buffer
                        buffer.append(c)
                        
                        // Check for prompt character
                        if (c == '>') {
                            // Extract response
                            val response = buffer.toString().trim()
                            buffer.clear()
                            
                            // Log response
                            Log.d(NAME, "Response: $response")
                            
                            // Check if we have a command waiting for this response
                            synchronized(responseCollectors) {
                                // Find matching collector
                                val matchingCommand = responseCollectors.keys.firstOrNull { cmd ->
                                    response.contains(cmd, ignoreCase = true)
                                }
                                
                                if (matchingCommand != null) {
                                    // Get collector
                                    val collector = responseCollectors[matchingCommand]
                                    
                                    // Add response
                                    collector?.addResponse(response)
                                } else {
                                    // Unsolicited response, send as event
                                    sendEvent("data", "Unsolicited data", Arguments.createMap().apply {
                                        putString("rawResponse", response)
                                    })
                                }
                            }
                        }
                    } catch (e: Exception) {
                        if (isConnected.get()) {
                            Log.e(NAME, "Error reading response", e)
                            sendEvent("error", "Read error: ${e.message}", null)
                        }
                        break
                    }
                }
            } catch (e: Exception) {
                if (isConnected.get()) {
                    Log.e(NAME, "Response reader error", e)
                    sendEvent("error", "Reader error: ${e.message}", null)
                }
            }
        }
    }

    private suspend fun getSingleSensorValue(
        mode: Int,
        pid: Int,
        name: String,
        parser: (String?) -> Double?
    ): Double? {
        if (!isConnected.get()) {
            return null
        }
        
        return try {
            // Create command
            val command = String.format("%02X%02X", mode, pid)
            
            // Create response collector
            val responseCollector = ResponseCollector(responseTimeout.toLong())
            
            // Register collector
            synchronized(responseCollectors) {
                responseCollectors[command] = responseCollector
            }
            
            // Send command
            writer?.println(command + COMMAND_TERMINATOR)
            writer?.flush()
            
            // Log command
            Log.d(NAME, "Requesting $name: $command")
            
            // Wait for response
            val response = responseCollector.waitForResponse()
            
            // Unregister collector
            synchronized(responseCollectors) {
                responseCollectors.remove(command)
            }
            
            // Parse response
            parser(response)
        } catch (e: Exception) {
            Log.e(NAME, "$name request error", e)
            null
        }
    }

    private fun parseOBDResponse(mode: Int, pid: Int, response: String?): Any? {
        if (response == null || response.isEmpty()) {
            return null
        }
        
        try {
            // Different PIDs have different parsing logic
            when (mode) {
                0x01 -> { // Current data
                    when (pid) {
                        0x0C -> { // RPM
                            val parts = response.split(" ")
                            if (parts.size >= 4) {
                                val a = parts[2].toInt(16)
                                val b = parts[3].toInt(16)
                                return ((a * 256) + b) / 4.0
                            }
                        }
                        0x0D -> { // Speed
                            val parts = response.split(" ")
                            if (parts.size >= 3) {
                                return parts[2].toInt(16).toDouble()
                            }
                        }
                        0x05 -> { // Coolant temperature
                            val parts = response.split(" ")
                            if (parts.size >= 3) {
                                return parts[2].toInt(16) - 40.0
                            }
                        }
                        // Add more PID parsing as needed
                    }
                }
                // Add more mode parsing as needed
            }
        } catch (e: Exception) {
            Log.e(NAME, "Response parsing error", e)
        }
        
        return null
    }

    private fun parseDTCs(response: String): List<String> {
        val dtcs = mutableListOf<String>()
        
        try {
            // Split response into lines
            val lines = response.split("\r", "\n").filter { it.isNotEmpty() }
            
            for (line in lines) {
                // Skip echo and prompt
                if (line == "03" || line == ">") {
                    continue
                }
                
                // Check if line starts with 43 (response to mode 03)
                if (line.startsWith("43")) {
                    // Extract DTC bytes
                    val parts = line.split(" ")
                    
                    // Process pairs of bytes (each DTC is 2 bytes)
                    var i = 1 // Skip the "43" prefix
                    while (i < parts.size - 1) {
                        val firstByte = parts[i].toIntOrNull(16) ?: break
                        val secondByte = parts[i + 1].toIntOrNull(16) ?: break
                        
                        // Skip if both bytes are 0 (no DTC)
                        if (firstByte == 0 && secondByte == 0) {
                            i += 2
                            continue
                        }
                        
                        // Extract DTC
                        val dtc = decodeDTC(firstByte, secondByte)
                        if (dtc.isNotEmpty()) {
                            dtcs.add(dtc)
                        }
                        
                        i += 2
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(NAME, "DTC parsing error", e)
        }
        
        return dtcs
    }

    private fun decodeDTC(firstByte: Int, secondByte: Int): String {
        try {
            // Extract DTC type from first byte
            val type = when ((firstByte and 0xC0) shr 6) {
                0 -> "P" // Powertrain
                1 -> "C" // Chassis
                2 -> "B" // Body
                3 -> "U" // Network
                else -> "P" // Default to Powertrain
            }
            
            // Extract remaining digits
            val digit1 = (firstByte and 0x30) shr 4
            val digit2 = firstByte and 0x0F
            val digit3 = (secondByte and 0xF0) shr 4
            val digit4 = secondByte and 0x0F
            
            // Format DTC
            return String.format("%s%d%d%d%d", type, digit1, digit2, digit3, digit4)
        } catch (e: Exception) {
            Log.e(NAME, "DTC decode error", e)
            return ""
        }
    }

    private fun parseReadinessStatus(response: String): Pair<Boolean, List<String>> {
        val incompleteTests = mutableListOf<String>()
        var ready = true
        
        try {
            // Split response into lines
            val lines = response.split("\r", "\n").filter { it.isNotEmpty() }
            
            for (line in lines) {
                // Skip echo and prompt
                if (line == "0101" || line == ">") {
                    continue
                }
                
                // Check if line starts with 41 01 (response to mode 01, PID 01)
                if (line.startsWith("41 01")) {
                    // Extract readiness bytes
                    val parts = line.split(" ")
                    if (parts.size >= 4) {
                        // Byte A contains MIL status and DTC count
                        val byteA = parts[2].toInt(16)
                        
                        // Byte B contains readiness test status
                        val byteB = parts[3].toInt(16)
                        
                        // Check if MIL is on
                        val milOn = (byteA and 0x80) != 0
                        if (milOn) {
                            ready = false
                            incompleteTests.add("MIL is ON")
                        }
                        
                        // Check readiness tests
                        val tests = mapOf(
                            "Misfire" to (byteB and 0x01) != 0,
                            "Fuel System" to (byteB and 0x02) != 0,
                            "Components" to (byteB and 0x04) != 0
                            // Add more tests as needed
                        )
                        
                        for ((test, incomplete) in tests) {
                            if (incomplete) {
                                ready = false
                                incompleteTests.add(test)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(NAME, "Readiness parsing error", e)
            ready = false
            incompleteTests.add("Parsing error")
        }
        
        return Pair(ready, incompleteTests)
    }

    private fun parseVIN(response: String): String? {
        try {
            // Split response into lines
            val lines = response.split("\r", "\n").filter { it.isNotEmpty() }
            
            val vinHex = StringBuilder()
            
            for (line in lines) {
                // Skip echo and prompt
                if (line == "0902" || line == ">") {
                    continue
                }
                
                // Check if line starts with 49 02 (response to mode 09, PID 02)
                if (line.startsWith("49 02")) {
                    // Extract VIN bytes
                    val parts = line.split(" ")
                    
                    // Skip the first 3 parts (49 02 01)
                    for (i in 3 until parts.size) {
                        vinHex.append(parts[i])
                    }
                }
            }
            
            // Convert hex to ASCII
            if (vinHex.isNotEmpty()) {
                val bytes = ByteArray(vinHex.length / 2)
                for (i in bytes.indices) {
                    val index = i * 2
                    bytes[i] = vinHex.substring(index, index + 2).toInt(16).toByte()
                }
                return String(bytes)
            }
        } catch (e: Exception) {
            Log.e(NAME, "VIN parsing error", e)
        }
        
        return null
    }

    private fun parseSupportedPIDs(mode: Int, range: Int, response: String): List<Int> {
        val supportedPIDs = mutableListOf<Int>()
        
        try {
            // Split response into lines
            val lines = response.split("\r", "\n").filter { it.isNotEmpty() }
            
            for (line in lines) {
                // Skip echo and prompt
                if (line == String.format("%02X%02X", mode, range) || line == ">") {
                    continue
                }
                
                // Check if line starts with the expected response
                val expectedPrefix = String.format("%02X %02X", mode + 0x40, range)
                if (line.startsWith(expectedPrefix)) {
                    // Extract data bytes
                    val parts = line.split(" ")
                    if (parts.size >= 6) {
                        // Convert 4 data bytes to 32-bit integer
                        val a = parts[2].toInt(16)
                        val b = parts[3].toInt(16)
                        val c = parts[4].toInt(16)
                        val d = parts[5].toInt(16)
                        val bits = (a.toLong() shl 24) or (b.toLong() shl 16) or (c.toLong() shl 8) or d.toLong()
                        
                        // Check each bit
                        for (i in 0..31) {
                            if ((bits and (1L shl (31 - i))) != 0L) {
                                supportedPIDs.add(range + i + 1)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(NAME, "Supported PIDs parsing error", e)
        }
        
        return supportedPIDs
    }

    private fun getProtocolName(protocol: Int): String {
        return when (protocol) {
            PROTOCOL_AUTO -> "Auto"
            PROTOCOL_ISO9141_5BAUD -> "ISO9141-2 (5 baud init)"
            PROTOCOL_ISO14230_5BAUD -> "ISO14230-4 KWP (5 baud init)"
            PROTOCOL_ISO14230_FAST -> "ISO14230-4 KWP (fast init)"
            PROTOCOL_ISO15765_11BIT_500K -> "ISO15765-4 CAN (11-bit, 500K)"
            PROTOCOL_ISO15765_29BIT_500K -> "ISO15765-4 CAN (29-bit, 500K)"
            PROTOCOL_ISO15765_11BIT_250K -> "ISO15765-4 CAN (11-bit, 250K)"
            PROTOCOL_ISO15765_29BIT_250K -> "ISO15765-4 CAN (29-bit, 250K)"
            else -> "Unknown"
        }
    }

    private fun initializeDtcDatabase() {
        // This is a simplified DTC database with a few common codes
        // In a real implementation, this would be much more comprehensive
        dtcDatabase["P0100"] = Pair("Mass or Volume Air Flow Circuit Malfunction", "medium")
        dtcDatabase["P0101"] = Pair("Mass or Volume Air Flow Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0102"] = Pair("Mass or Volume Air Flow Circuit Low Input", "medium")
        dtcDatabase["P0103"] = Pair("Mass or Volume Air Flow Circuit High Input", "medium")
        dtcDatabase["P0104"] = Pair("Mass or Volume Air Flow Circuit Intermittent", "medium")
        dtcDatabase["P0105"] = Pair("Manifold Absolute Pressure/Barometric Pressure Circuit Malfunction", "medium")
        dtcDatabase["P0106"] = Pair("Manifold Absolute Pressure/Barometric Pressure Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0107"] = Pair("Manifold Absolute Pressure/Barometric Pressure Circuit Low Input", "medium")
        dtcDatabase["P0108"] = Pair("Manifold Absolute Pressure/Barometric Pressure Circuit High Input", "medium")
        dtcDatabase["P0109"] = Pair("Manifold Absolute Pressure/Barometric Pressure Circuit Intermittent", "medium")
        dtcDatabase["P0110"] = Pair("Intake Air Temperature Circuit Malfunction", "low")
        dtcDatabase["P0111"] = Pair("Intake Air Temperature Circuit Range/Performance Problem", "low")
        dtcDatabase["P0112"] = Pair("Intake Air Temperature Circuit Low Input", "low")
        dtcDatabase["P0113"] = Pair("Intake Air Temperature Circuit High Input", "low")
        dtcDatabase["P0114"] = Pair("Intake Air Temperature Circuit Intermittent", "low")
        dtcDatabase["P0115"] = Pair("Engine Coolant Temperature Circuit Malfunction", "medium")
        dtcDatabase["P0116"] = Pair("Engine Coolant Temperature Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0117"] = Pair("Engine Coolant Temperature Circuit Low Input", "medium")
        dtcDatabase["P0118"] = Pair("Engine Coolant Temperature Circuit High Input", "medium")
        dtcDatabase["P0119"] = Pair("Engine Coolant Temperature Circuit Intermittent", "medium")
        dtcDatabase["P0120"] = Pair("Throttle Position Sensor/Switch A Circuit Malfunction", "medium")
        dtcDatabase["P0121"] = Pair("Throttle Position Sensor/Switch A Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0122"] = Pair("Throttle Position Sensor/Switch A Circuit Low Input", "medium")
        dtcDatabase["P0123"] = Pair("Throttle Position Sensor/Switch A Circuit High Input", "medium")
        dtcDatabase["P0124"] = Pair("Throttle Position Sensor/Switch A Circuit Intermittent", "medium")
        dtcDatabase["P0125"] = Pair("Insufficient Coolant Temperature for Closed Loop Fuel Control", "low")
        dtcDatabase["P0126"] = Pair("Insufficient Coolant Temperature for Stable Operation", "low")
        dtcDatabase["P0127"] = Pair("Intake Air Temperature Too High", "low")
        dtcDatabase["P0128"] = Pair("Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)", "low")
        dtcDatabase["P0129"] = Pair("Barometric Pressure Too Low", "low")
        dtcDatabase["P0130"] = Pair("O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)", "medium")
        // Add more codes as needed
    }

    // --- Response Collector ---

    private val responseCollectors = ConcurrentHashMap<String, ResponseCollector>()

    private class ResponseCollector(private val timeoutMs: Long) {
        private var response: String? = null
        private val latch = java.util.concurrent.CountDownLatch(1)

        fun addResponse(response: String) {
            this.response = response
            latch.countDown()
        }

        suspend fun waitForResponse(): String? {
            return withContext(Dispatchers.IO) {
                try {
                    latch.await(timeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS)
                    response
                } catch (e: Exception) {
                    null
                }
            }
        }
    }

    // --- Cleanup ---

    override fun invalidate() {
        super.invalidate()
        
        // Cancel all coroutines
        moduleScope.cancel()
        
        // Disconnect from OBD adapter
        closeConnection()
        
        // Clear collections
        responseCollectors.clear()
        dtcDatabase.clear()
        monitoringItems.clear()
        
        Log.d(NAME, "Module invalidated")
    }
}
```

## Package Registration

Next, let's create the package class to register our module with React Native.

Create a file at `android/src/main/java/com/obdwifi/ObdWiFiPackage.kt`:

```kotlin
package com.obdwifi

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class ObdWiFiPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ObdWiFiModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}
```

## Socket Communication

The implementation above includes comprehensive socket communication handling:

1. **Connection Establishment**:
   - Creates a socket and connects to the specified IP address and port
   - Sets up input and output streams for communication
   - Handles connection timeouts and errors

2. **Command Transmission**:
   - Sends commands with proper termination characters
   - Handles command timeouts
   - Provides both raw command and structured PID request methods

3. **Response Processing**:
   - Continuously reads from the socket in a background coroutine
   - Collects responses until the prompt character is received
   - Routes responses to the appropriate command handlers
   - Parses responses based on command type

4. **Connection Management**:
   - Monitors connection state
   - Handles disconnection and cleanup
   - Provides reconnection capabilities

## Protocol Handling

The implementation supports all seven OBD-II protocols through the following mechanisms:

1. **Protocol Selection**:
   - Allows automatic protocol detection (default)
   - Supports manual protocol selection
   - Sets protocol during initialization with the `ATSP` command

2. **Protocol-Specific Behavior**:
   - Handles different response formats based on protocol
   - Adjusts timing parameters for different protocols
   - Manages protocol-specific initialization sequences

3. **Protocol Constants**:
   - Defines constants for all supported protocols
   - Maps protocol numbers to human-readable names
   - Provides protocol information in connection status

## Event Emission

The implementation uses React Native's event emitter system to communicate asynchronous events to JavaScript:

1. **Event Types**:
   - `data`: Vehicle data received from the adapter
   - `error`: Communication or protocol errors
   - `status`: Module status updates
   - `connection`: Connection state changes
   - `log`: Debugging information

2. **Event Structure**:
   - Timestamp for when the event occurred
   - Event type for categorization
   - Message for human-readable description
   - Optional structured data for programmatic processing

3. **Event Handling**:
   - Tracks listener count to optimize resource usage
   - Automatically stops monitoring when no listeners remain
   - Provides methods for adding and removing listeners

In the next section, we'll implement the iOS version of our module using Swift.
# 7. iOS Implementation

This section provides a detailed implementation of the OBD-II WiFi module for iOS using Swift. We'll create the necessary classes to handle socket communication, protocol management, and event emission.

## Module Implementation

Let's start by implementing the main module class that conforms to the generated protocol from Codegen.

First, create a bridging header file to expose React Native headers to Swift:

Create a file at `ios/ObdWiFi-Bridging-Header.h`:

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
```

Next, create the Objective-C file needed to register the Swift module with React Native:

Create a file at `ios/ObdWiFiModule.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RTNObdWiFi, NSObject)

// --- Connection Methods ---
RCT_EXTERN_METHOD(connect:(NSDictionary *)config
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnect:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isConnected:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getConnectionStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// --- Command Methods ---
RCT_EXTERN_METHOD(sendCommand:(NSString *)command
                  timeoutMs:(NSNumber * _Nullable)timeoutMs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(sendPidRequest:(nonnull NSNumber *)mode
                  pid:(NSNumber * _Nullable)pid
                  timeoutMs:(NSNumber * _Nullable)timeoutMs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// --- Diagnostic Methods ---
RCT_EXTERN_METHOD(initializeConnection:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(readDiagnosticCodes:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearDiagnosticCodes:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getEmissionsReadiness:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// --- Data Retrieval Methods ---
RCT_EXTERN_METHOD(getEngineRPM:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getVehicleSpeed:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCoolantTemperature:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getMultipleSensorValues:(NSArray *)items
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// --- Continuous Monitoring ---
RCT_EXTERN_METHOD(startContinuousMonitoring:(NSArray *)items
                  intervalMs:(nonnull NSNumber *)intervalMs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopContinuousMonitoring:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// --- Vehicle Information ---
RCT_EXTERN_METHOD(getVehicleVIN:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSupportedPIDs:(nonnull NSNumber *)mode
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// --- Event Handling ---
RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(double)count)

@end
```

Now, let's implement the Swift module:

Create a file at `ios/ObdWiFiModule.swift`:

```swift
import Foundation
import Network
import os.log

@objc(RTNObdWiFi)
class ObdWiFiModule: RCTEventEmitter {
    
    // MARK: - Constants
    
    private let EVENT_NAME = "ObdWiFiEvent"
    
    // OBD-II Protocol constants
    private let PROTOCOL_AUTO = 0
    private let PROTOCOL_ISO9141_5BAUD = 1
    private let PROTOCOL_ISO14230_5BAUD = 2
    private let PROTOCOL_ISO14230_FAST = 3
    private let PROTOCOL_ISO15765_11BIT_500K = 4
    private let PROTOCOL_ISO15765_29BIT_500K = 5
    private let PROTOCOL_ISO15765_11BIT_250K = 6
    private let PROTOCOL_ISO15765_29BIT_250K = 7
    
    // Default timeouts
    private let DEFAULT_CONNECTION_TIMEOUT = 10000 // 10 seconds
    private let DEFAULT_RESPONSE_TIMEOUT = 5000 // 5 seconds
    
    // Command terminators
    private let COMMAND_TERMINATOR = "\r"
    private let RESPONSE_PROMPT = ">"
    
    // MARK: - Properties
    
    // Connection properties
    private var connection: NWConnection?
    private var isConnected = false
    private var isInitialized = false
    
    // Connection configuration
    private var ipAddress: String = ""
    private var port: UInt16 = 0
    private var autoConnect: Bool = false
    private var connectionTimeout: Int = 0
    private var responseTimeout: Int = 0
    private var protocol: Int = 0
    
    // Response handling
    private var responseBuffer = Data()
    private var responseCollectors = [String: ResponseCollector]()
    
    // Continuous monitoring
    private var monitoringTimer: Timer?
    private var monitoringItems = [[String: Int]]()
    private var monitoringInterval: TimeInterval = 1.0 // Default 1 second
    
    // DTC database (simplified for this example)
    private var dtcDatabase = [String: (String, String)]()
    
    // Event listener count
    private var listenerCount = 0
    
    // Logger
    private let logger = OSLog(subsystem: "com.obdwifi", category: "ObdWiFiModule")
    
    // MARK: - Initialization
    
    override init() {
        super.init()
        initializeDtcDatabase()
    }
    
    // MARK: - RCTEventEmitter Overrides
    
    override func supportedEvents() -> [String] {
        return [EVENT_NAME]
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // MARK: - Connection Methods
    
    @objc func connect(_ config: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Extract configuration
        guard let ipAddressValue = config["ipAddress"] as? String,
              let portValue = config["port"] as? NSNumber else {
            reject("INVALID_CONFIG", "Invalid IP address or port", nil)
            return
        }
        
        ipAddress = ipAddressValue
        port = UInt16(truncating: portValue)
        autoConnect = config["autoConnect"] as? Bool ?? false
        connectionTimeout = config["connectionTimeout"] as? Int ?? DEFAULT_CONNECTION_TIMEOUT
        responseTimeout = config["responseTimeout"] as? Int ?? DEFAULT_RESPONSE_TIMEOUT
        protocol = config["protocol"] as? Int ?? PROTOCOL_AUTO
        
        if ipAddress.isEmpty || port == 0 {
            reject("INVALID_CONFIG", "Invalid IP address or port", nil)
            return
        }
        
        // Disconnect if already connected
        if isConnected {
            disconnect { _ in } reject: { _, _, _ in }
        }
        
        // Create connection
        let host = NWEndpoint.Host(ipAddress)
        let port = NWEndpoint.Port(rawValue: self.port)!
        let connection = NWConnection(host: host, port: port, using: .tcp)
        self.connection = connection
        
        // Set up state handler
        connection.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            
            switch state {
            case .ready:
                self.isConnected = true
                self.isInitialized = false
                self.sendEvent(type: "connection", message: "Connected to \(self.ipAddress):\(self.port)", data: nil)
                self.startReceiving()
                resolve(true)
                
            case .failed(let error):
                os_log("Connection failed: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                self.sendEvent(type: "error", message: "Connection failed: \(error.localizedDescription)", data: nil)
                self.closeConnection()
                reject("CONNECTION_ERROR", error.localizedDescription, nil)
                
            case .cancelled:
                self.isConnected = false
                self.isInitialized = false
                self.sendEvent(type: "connection", message: "Disconnected", data: nil)
                
            default:
                break
            }
        }
        
        // Start connection with timeout
        connection.start(queue: .global(qos: .userInitiated))
        
        // Set up connection timeout
        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + .milliseconds(connectionTimeout)) { [weak self] in
            guard let self = self, let connection = self.connection, !self.isConnected else { return }
            
            os_log("Connection timeout", log: self.logger, type: .error)
            self.sendEvent(type: "error", message: "Connection timeout", data: nil)
            connection.cancel()
            reject("CONNECTION_TIMEOUT", "Connection timeout", nil)
        }
    }
    
    @objc func disconnect(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Stop monitoring if active
        stopContinuousMonitoring { _ in } reject: { _, _, _ in }
        
        // Close connection
        closeConnection()
        
        // Send event
        sendEvent(type: "connection", message: "Disconnected", data: nil)
        
        // Resolve promise
        resolve(true)
    }
    
    @objc func isConnected(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve(isConnected)
    }
    
    @objc func getConnectionStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        var status: [String: Any] = ["connected": isConnected]
        
        if isConnected {
            status["ipAddress"] = ipAddress
            status["port"] = port
            status["protocol"] = protocol
            status["protocolName"] = getProtocolName(protocol: protocol)
            // We would track connection time in a real implementation
            status["elapsedTimeMs"] = 0
        }
        
        resolve(status)
    }
    
    // MARK: - Command Methods
    
    @objc func sendCommand(_ command: String, timeoutMs: NSNumber?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        let timeout = timeoutMs?.intValue ?? responseTimeout
        
        // Send command
        let fullCommand = command + COMMAND_TERMINATOR
        let data = Data(fullCommand.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("Send command error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                reject("COMMAND_ERROR", error.localizedDescription, nil)
                return
            }
            
            // Log command
            os_log("Sent command: %{public}@", log: self.logger, type: .debug, command)
            self.sendEvent(type: "log", message: "Sent: \(command)", data: nil)
            
            // Resolve promise
            resolve(true)
        })
    }
    
    @objc func sendPidRequest(_ mode: NSNumber, pid: NSNumber?, timeoutMs: NSNumber?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        let modeInt = mode.intValue
        let pidInt = pid?.intValue
        let timeout = timeoutMs?.intValue ?? responseTimeout
        
        // Build command
        let command: String
        if let pidInt = pidInt {
            command = String(format: "%02X%02X", modeInt, pidInt)
        } else {
            command = String(format: "%02X", modeInt)
        }
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(timeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors[command] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command
        let fullCommand = command + COMMAND_TERMINATOR
        let data = Data(fullCommand.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("Send PID request error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: command)
                objc_sync_exit(self.responseCollectors)
                
                reject("PID_ERROR", error.localizedDescription, nil)
                return
            }
            
            // Log command
            os_log("Sent PID request: %{public}@", log: self.logger, type: .debug, command)
            self.sendEvent(type: "log", message: "Sent PID: \(command)", data: nil)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: command)
                objc_sync_exit(self.responseCollectors)
                
                // Check for timeout
                if response == nil {
                    reject("TIMEOUT", "Command timed out: \(command)", nil)
                    return
                }
                
                // Resolve with response
                resolve(response!)
            }
        })
    }
    
    // MARK: - Diagnostic Methods
    
    @objc func initializeConnection(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        // Send initialization commands
        let commands = [
            "ATZ",      // Reset
            "ATE0",     // Echo off
            "ATL0",     // Linefeeds off
            "ATH1",     // Headers on
            "ATS0",     // Spaces off
            "ATSP\(protocol)" // Set protocol
        ]
        
        // Execute commands sequentially
        executeCommandsSequentially(commands: commands) { [weak self] success in
            guard let self = self else { return }
            
            // Set initialized flag
            self.isInitialized = success
            
            // Send event
            if success {
                self.sendEvent(type: "status", message: "OBD adapter initialized", data: nil)
            } else {
                self.sendEvent(type: "error", message: "OBD adapter initialization failed", data: nil)
            }
            
            // Resolve promise
            resolve(success)
        }
    }
    
    @objc func readDiagnosticCodes(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors["03"] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command to get DTCs
        let command = "03" + COMMAND_TERMINATOR
        let data = Data(command.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("Read DTCs error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "03")
                objc_sync_exit(self.responseCollectors)
                
                reject("DTC_ERROR", error.localizedDescription, nil)
                return
            }
            
            // Log command
            os_log("Reading DTCs", log: self.logger, type: .debug)
            self.sendEvent(type: "log", message: "Reading DTCs", data: nil)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "03")
                objc_sync_exit(self.responseCollectors)
                
                // Check for timeout
                if response == nil {
                    reject("TIMEOUT", "DTC request timed out", nil)
                    return
                }
                
                // Parse DTCs
                let dtcs = self.parseDTCs(response: response!)
                
                // Create result array
                var resultArray: [[String: Any]] = []
                
                for dtc in dtcs {
                    let dtcInfo = self.dtcDatabase[dtc]
                    let dtcMap: [String: Any] = [
                        "code": dtc,
                        "description": dtcInfo?.0 ?? "Unknown code",
                        "severity": dtcInfo?.1 ?? "unknown"
                    ]
                    resultArray.append(dtcMap)
                }
                
                // Resolve with DTCs
                resolve(resultArray)
            }
        })
    }
    
    @objc func clearDiagnosticCodes(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors["04"] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command to clear DTCs
        let command = "04" + COMMAND_TERMINATOR
        let data = Data(command.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("Clear DTCs error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "04")
                objc_sync_exit(self.responseCollectors)
                
                reject("CLEAR_DTC_ERROR", error.localizedDescription, nil)
                return
            }
            
            // Log command
            os_log("Clearing DTCs", log: self.logger, type: .debug)
            self.sendEvent(type: "log", message: "Clearing DTCs", data: nil)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "04")
                objc_sync_exit(self.responseCollectors)
                
                // Check for timeout
                if response == nil {
                    reject("TIMEOUT", "Clear DTCs request timed out", nil)
                    return
                }
                
                // Check if successful
                let success = response!.contains("44") || response!.contains("OK")
                
                // Send event
                if success {
                    self.sendEvent(type: "status", message: "DTCs cleared successfully", data: nil)
                } else {
                    self.sendEvent(type: "error", message: "Failed to clear DTCs", data: nil)
                }
                
                // Resolve with success
                resolve(success)
            }
        })
    }
    
    @objc func getEmissionsReadiness(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors["0101"] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command to get readiness status
        let command = "0101" + COMMAND_TERMINATOR
        let data = Data(command.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("Readiness check error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "0101")
                objc_sync_exit(self.responseCollectors)
                
                reject("READINESS_ERROR", error.localizedDescription, nil)
                return
            }
            
            // Log command
            os_log("Checking emissions readiness", log: self.logger, type: .debug)
            self.sendEvent(type: "log", message: "Checking emissions readiness", data: nil)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "0101")
                objc_sync_exit(self.responseCollectors)
                
                // Check for timeout
                if response == nil {
                    reject("TIMEOUT", "Readiness check timed out", nil)
                    return
                }
                
                // Parse readiness status
                let (ready, incompleteTests) = self.parseReadinessStatus(response: response!)
                
                // Create result
                let result: [String: Any] = [
                    "ready": ready,
                    "incompleteTests": incompleteTests
                ]
                
                // Resolve with readiness status
                resolve(result)
            }
        })
    }
    
    // MARK: - Data Retrieval Methods
    
    @objc func getEngineRPM(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        getSingleSensorValue(mode: 0x01, pid: 0x0C, name: "RPM") { response in
            if let response = response, !response.isEmpty {
                do {
                    // Parse RPM from response
                    // Format: 41 0C XX YY where RPM = ((256*XX) + YY) / 4
                    let parts = response.components(separatedBy: " ")
                    if parts.count >= 4 {
                        let a = Int(parts[2], radix: 16) ?? 0
                        let b = Int(parts[3], radix: 16) ?? 0
                        let rpm = Double((a * 256) + b) / 4.0
                        return rpm
                    }
                } catch {
                    os_log("RPM parsing error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                }
            }
            return nil
        } resolve: { value in
            resolve(value)
        } reject: { error in
            reject("RPM_ERROR", error.localizedDescription, nil)
        }
    }
    
    @objc func getVehicleSpeed(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        getSingleSensorValue(mode: 0x01, pid: 0x0D, name: "Speed") { response in
            if let response = response, !response.isEmpty {
                do {
                    // Parse speed from response
                    // Format: 41 0D XX where speed = XX in km/h
                    let parts = response.components(separatedBy: " ")
                    if parts.count >= 3 {
                        let speed = Double(Int(parts[2], radix: 16) ?? 0)
                        return speed
                    }
                } catch {
                    os_log("Speed parsing error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                }
            }
            return nil
        } resolve: { value in
            resolve(value)
        } reject: { error in
            reject("SPEED_ERROR", error.localizedDescription, nil)
        }
    }
    
    @objc func getCoolantTemperature(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        getSingleSensorValue(mode: 0x01, pid: 0x05, name: "Coolant Temperature") { response in
            if let response = response, !response.isEmpty {
                do {
                    // Parse temperature from response
                    // Format: 41 05 XX where temperature = XX - 40 in Celsius
                    let parts = response.components(separatedBy: " ")
                    if parts.count >= 3 {
                        let temp = Double(Int(parts[2], radix: 16) ?? 0) - 40.0
                        return temp
                    }
                } catch {
                    os_log("Temperature parsing error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                }
            }
            return nil
        } resolve: { value in
            resolve(value)
        } reject: { error in
            reject("TEMP_ERROR", error.localizedDescription, nil)
        }
    }
    
    @objc func getMultipleSensorValues(_ items: NSArray, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        let dispatchGroup = DispatchGroup()
        var result: [String: Any] = [:]
        var errors: [Error] = []
        
        for item in items {
            guard let itemDict = item as? [String: Any],
                  let mode = itemDict["mode"] as? Int,
                  let pid = itemDict["pid"] as? Int else {
                continue
            }
            
            dispatchGroup.enter()
            
            // Create command
            let command = String(format: "%02X%02X", mode, pid)
            
            // Create response collector
            let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
            
            // Register collector
            objc_sync_enter(responseCollectors)
            responseCollectors[command] = responseCollector
            objc_sync_exit(responseCollectors)
            
            // Send command
            let fullCommand = command + COMMAND_TERMINATOR
            let data = Data(fullCommand.utf8)
            
            connection.send(content: data, completion: .contentProcessed { [weak self] error in
                guard let self = self else {
                    dispatchGroup.leave()
                    return
                }
                
                if let error = error {
                    os_log("Multi-sensor request error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                    errors.append(error)
                    
                    // Unregister collector
                    objc_sync_enter(self.responseCollectors)
                    self.responseCollectors.removeValue(forKey: command)
                    objc_sync_exit(self.responseCollectors)
                    
                    dispatchGroup.leave()
                    return
                }
                
                // Log command
                os_log("Multi-sensor request: %{public}@", log: self.logger, type: .debug, command)
                
                // Wait for response
                DispatchQueue.global(qos: .userInitiated).async {
                    let response = responseCollector.waitForResponse()
                    
                    // Unregister collector
                    objc_sync_enter(self.responseCollectors)
                    self.responseCollectors.removeValue(forKey: command)
                    objc_sync_exit(self.responseCollectors)
                    
                    // Parse response
                    let value = self.parseOBDResponse(mode: mode, pid: pid, response: response)
                    
                    // Add to result
                    let key = "\(mode):\(pid)"
                    objc_sync_enter(result)
                    result[key] = value
                    objc_sync_exit(result)
                    
                    dispatchGroup.leave()
                }
            })
        }
        
        // Wait for all requests to complete
        dispatchGroup.notify(queue: .global(qos: .userInitiated)) {
            if !errors.isEmpty {
                reject("SENSOR_ERROR", "One or more sensor requests failed", errors.first)
                return
            }
            
            resolve(result)
        }
    }
    
    // MARK: - Continuous Monitoring
    
    @objc func startContinuousMonitoring(_ items: NSArray, intervalMs: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        // Stop existing monitoring
        stopContinuousMonitoring { _ in } reject: { _, _, _ in }
        
        // Convert items to list
        var itemsList: [[String: Int]] = []
        for item in items {
            guard let itemDict = item as? [String: Any],
                  let mode = itemDict["mode"] as? Int,
                  let pid = itemDict["pid"] as? Int else {
                continue
            }
            itemsList.append(["mode": mode, "pid": pid])
        }
        
        // Store monitoring parameters
        monitoringItems = itemsList
        monitoringInterval = TimeInterval(intervalMs.doubleValue / 1000.0)
        
        // Start monitoring timer
        monitoringTimer = Timer.scheduledTimer(withTimeInterval: monitoringInterval, repeats: true) { [weak self] _ in
            guard let self = self, self.isConnected, let connection = self.connection else { return }
            
            let dispatchGroup = DispatchGroup()
            var result: [String: Any] = ["timestamp": Date().timeIntervalSince1970 * 1000]
            
            for item in self.monitoringItems {
                guard let mode = item["mode"], let pid = item["pid"] else { continue }
                
                dispatchGroup.enter()
                
                // Create command
                let command = String(format: "%02X%02X", mode, pid)
                
                // Create response collector
                let responseCollector = ResponseCollector(timeout: TimeInterval(self.responseTimeout) / 1000.0)
                
                // Register collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors[command] = responseCollector
                objc_sync_exit(self.responseCollectors)
                
                // Send command
                let fullCommand = command + self.COMMAND_TERMINATOR
                let data = Data(fullCommand.utf8)
                
                connection.send(content: data, completion: .contentProcessed { error in
                    if let error = error {
                        os_log("Monitoring request error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                        
                        // Unregister collector
                        objc_sync_enter(self.responseCollectors)
                        self.responseCollectors.removeValue(forKey: command)
                        objc_sync_exit(self.responseCollectors)
                        
                        dispatchGroup.leave()
                        return
                    }
                    
                    // Wait for response
                    DispatchQueue.global(qos: .userInitiated).async {
                        let response = responseCollector.waitForResponse()
                        
                        // Unregister collector
                        objc_sync_enter(self.responseCollectors)
                        self.responseCollectors.removeValue(forKey: command)
                        objc_sync_exit(self.responseCollectors)
                        
                        // Parse response
                        let value = self.parseOBDResponse(mode: mode, pid: pid, response: response)
                        
                        // Add to result
                        let key = "\(mode):\(pid)"
                        objc_sync_enter(result)
                        result[key] = value
                        objc_sync_exit(result)
                        
                        dispatchGroup.leave()
                    }
                })
            }
            
            // Wait for all requests to complete
            dispatchGroup.notify(queue: .global(qos: .userInitiated)) {
                // Send event with data
                let eventData: [String: Any] = ["values": result]
                self.sendEvent(type: "data", message: "Monitoring data", data: eventData)
            }
        }
        
        // Resolve promise
        resolve(true)
    }
    
    @objc func stopContinuousMonitoring(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Cancel monitoring timer
        monitoringTimer?.invalidate()
        monitoringTimer = nil
        
        // Clear monitoring parameters
        monitoringItems.removeAll()
        
        // Send event
        sendEvent(type: "status", message: "Monitoring stopped", data: nil)
        
        // Resolve promise
        resolve(true)
    }
    
    // MARK: - Vehicle Information
    
    @objc func getVehicleVIN(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors["0902"] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command to get VIN
        let command = "0902" + COMMAND_TERMINATOR
        let data = Data(command.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("VIN request error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "0902")
                objc_sync_exit(self.responseCollectors)
                
                reject("VIN_ERROR", error.localizedDescription, nil)
                return
            }
            
            // Log command
            os_log("Requesting VIN", log: self.logger, type: .debug)
            self.sendEvent(type: "log", message: "Requesting VIN", data: nil)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: "0902")
                objc_sync_exit(self.responseCollectors)
                
                // Check for timeout
                if response == nil {
                    reject("TIMEOUT", "VIN request timed out", nil)
                    return
                }
                
                // Parse VIN
                let vin = self.parseVIN(response: response!)
                
                // Resolve with VIN
                resolve(vin)
            }
        })
    }
    
    @objc func getSupportedPIDs(_ mode: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard isConnected, let connection = self.connection else {
            reject("NOT_CONNECTED", "Not connected to OBD adapter", nil)
            return
        }
        
        let modeInt = mode.intValue
        
        // Request supported PIDs in ranges (00, 20, 40, 60, ...)
        let ranges = [0x00, 0x20, 0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0]
        var supportedPIDs: [Int] = []
        
        let dispatchGroup = DispatchGroup()
        var errors: [Error] = []
        
        for range in ranges {
            dispatchGroup.enter()
            
            // Create command
            let command = String(format: "%02X%02X", modeInt, range)
            
            // Create response collector
            let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
            
            // Register collector
            objc_sync_enter(responseCollectors)
            responseCollectors[command] = responseCollector
            objc_sync_exit(responseCollectors)
            
            // Send command
            let fullCommand = command + COMMAND_TERMINATOR
            let data = Data(fullCommand.utf8)
            
            connection.send(content: data, completion: .contentProcessed { [weak self] error in
                guard let self = self else {
                    dispatchGroup.leave()
                    return
                }
                
                if let error = error {
                    os_log("Supported PIDs request error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                    errors.append(error)
                    
                    // Unregister collector
                    objc_sync_enter(self.responseCollectors)
                    self.responseCollectors.removeValue(forKey: command)
                    objc_sync_exit(self.responseCollectors)
                    
                    dispatchGroup.leave()
                    return
                }
                
                // Log command
                os_log("Requesting supported PIDs: %{public}@", log: self.logger, type: .debug, command)
                
                // Wait for response
                DispatchQueue.global(qos: .userInitiated).async {
                    let response = responseCollector.waitForResponse()
                    
                    // Unregister collector
                    objc_sync_enter(self.responseCollectors)
                    self.responseCollectors.removeValue(forKey: command)
                    objc_sync_exit(self.responseCollectors)
                    
                    // Check for timeout or no response
                    if response == nil || !(response!.contains(" ")) {
                        dispatchGroup.leave()
                        return
                    }
                    
                    // Parse supported PIDs
                    let pids = self.parseSupportedPIDs(mode: modeInt, range: range, response: response!)
                    
                    // Add to result
                    objc_sync_enter(supportedPIDs)
                    supportedPIDs.append(contentsOf: pids)
                    objc_sync_exit(supportedPIDs)
                    
                    // Check if we should continue to next range
                    if !pids.contains(range + 0x20) {
                        // Skip remaining ranges
                        dispatchGroup.leave()
                        return
                    }
                    
                    dispatchGroup.leave()
                }
            })
        }
        
        // Wait for all requests to complete
        dispatchGroup.notify(queue: .global(qos: .userInitiated)) {
            if !errors.isEmpty && supportedPIDs.isEmpty {
                reject("PID_SUPPORT_ERROR", "Failed to get supported PIDs", errors.first)
                return
            }
            
            resolve(supportedPIDs)
        }
    }
    
    // MARK: - Event Handling
    
    @objc func addListener(_ eventName: String) {
        // Increment listener count
        listenerCount += 1
        
        // Log
        os_log("Added listener: %{public}@, count: %d", log: logger, type: .debug, eventName, listenerCount)
    }
    
    @objc func removeListeners(_ count: Double) {
        // Decrement listener count
        listenerCount -= Int(count)
        if listenerCount < 0 {
            listenerCount = 0
        }
        
        // Log
        os_log("Removed listeners: %d, count: %d", log: logger, type: .debug, Int(count), listenerCount)
        
        // If no listeners remain, consider stopping continuous monitoring
        if listenerCount == 0 {
            stopContinuousMonitoring { _ in } reject: { _, _, _ in }
        }
    }
    
    // MARK: - Helper Methods
    
    private func sendEvent(type: String, message: String, data: [String: Any]?) {
        var event: [String: Any] = [
            "timestamp": Date().timeIntervalSince1970 * 1000,
            "type": type,
            "message": message
        ]
        
        if let data = data {
            event["data"] = data
        }
        
        sendEvent(withName: EVENT_NAME, body: event)
    }
    
    private func closeConnection() {
        // Cancel connection
        connection?.cancel()
        connection = nil
        
        // Clear state
        isConnected = false
        isInitialized = false
        responseBuffer.removeAll()
    }
    
    private func startReceiving() {
        receiveNext()
    }
    
    private func receiveNext() {
        guard isConnected, let connection = self.connection else { return }
        
        connection.receive(minimumIncompleteLength: 1, maximumLength: 1024) { [weak self] data, context, isComplete, error in
            guard let self = self else { return }
            
            if let error = error {
                if self.isConnected {
                    os_log("Receive error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                    self.sendEvent(type: "error", message: "Receive error: \(error.localizedDescription)", data: nil)
                }
                return
            }
            
            if let data = data, !data.isEmpty {
                // Append to buffer
                self.responseBuffer.append(data)
                
                // Check for prompt character
                if let lastByte = data.last, lastByte == UInt8(ascii: ">") {
                    // Extract response
                    let response = String(data: self.responseBuffer, encoding: .ascii)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                    self.responseBuffer.removeAll()
                    
                    // Log response
                    os_log("Response: %{public}@", log: self.logger, type: .debug, response)
                    
                    // Check if we have a command waiting for this response
                    objc_sync_enter(self.responseCollectors)
                    
                    // Find matching collector
                    let matchingCommand = self.responseCollectors.keys.first { cmd in
                        response.lowercased().contains(cmd.lowercased())
                    }
                    
                    if let matchingCommand = matchingCommand {
                        // Get collector
                        let collector = self.responseCollectors[matchingCommand]
                        
                        // Add response
                        collector?.addResponse(response: response)
                    } else {
                        // Unsolicited response, send as event
                        self.sendEvent(type: "data", message: "Unsolicited data", data: ["rawResponse": response])
                    }
                    
                    objc_sync_exit(self.responseCollectors)
                }
            }
            
            // Continue receiving
            if self.isConnected {
                self.receiveNext()
            }
        }
    }
    
    private func getSingleSensorValue(
        mode: Int,
        pid: Int,
        name: String,
        parser: @escaping (String?) -> Any?,
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (Error) -> Void
    ) {
        guard isConnected, let connection = self.connection else {
            reject(NSError(domain: "com.obdwifi", code: 1, userInfo: [NSLocalizedDescriptionKey: "Not connected to OBD adapter"]))
            return
        }
        
        // Create command
        let command = String(format: "%02X%02X", mode, pid)
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors[command] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command
        let fullCommand = command + COMMAND_TERMINATOR
        let data = Data(fullCommand.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else { return }
            
            if let error = error {
                os_log("%{public}@ request error: %{public}@", log: self.logger, type: .error, name, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: command)
                objc_sync_exit(self.responseCollectors)
                
                reject(error)
                return
            }
            
            // Log command
            os_log("Requesting %{public}@: %{public}@", log: self.logger, type: .debug, name, command)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: command)
                objc_sync_exit(self.responseCollectors)
                
                // Parse response
                let value = parser(response)
                
                // Resolve with value
                resolve(value)
            }
        })
    }
    
    private func parseOBDResponse(mode: Int, pid: Int, response: String?) -> Any? {
        guard let response = response, !response.isEmpty else {
            return nil
        }
        
        do {
            // Different PIDs have different parsing logic
            switch mode {
            case 0x01: // Current data
                switch pid {
                case 0x0C: // RPM
                    let parts = response.components(separatedBy: " ")
                    if parts.count >= 4 {
                        let a = Int(parts[2], radix: 16) ?? 0
                        let b = Int(parts[3], radix: 16) ?? 0
                        return Double((a * 256) + b) / 4.0
                    }
                case 0x0D: // Speed
                    let parts = response.components(separatedBy: " ")
                    if parts.count >= 3 {
                        return Double(Int(parts[2], radix: 16) ?? 0)
                    }
                case 0x05: // Coolant temperature
                    let parts = response.components(separatedBy: " ")
                    if parts.count >= 3 {
                        return Double(Int(parts[2], radix: 16) ?? 0) - 40.0
                    }
                // Add more PID parsing as needed
                default:
                    break
                }
            // Add more mode parsing as needed
            default:
                break
            }
        } catch {
            os_log("Response parsing error: %{public}@", log: logger, type: .error, error.localizedDescription)
        }
        
        return nil
    }
    
    private func parseDTCs(response: String) -> [String] {
        var dtcs: [String] = []
        
        do {
            // Split response into lines
            let lines = response.components(separatedBy: CharacterSet(charactersIn: "\r\n")).filter { !$0.isEmpty }
            
            for line in lines {
                // Skip echo and prompt
                if line == "03" || line == ">" {
                    continue
                }
                
                // Check if line starts with 43 (response to mode 03)
                if line.hasPrefix("43") {
                    // Extract DTC bytes
                    let parts = line.components(separatedBy: " ")
                    
                    // Process pairs of bytes (each DTC is 2 bytes)
                    var i = 1 // Skip the "43" prefix
                    while i < parts.count - 1 {
                        guard let firstByte = Int(parts[i], radix: 16),
                              let secondByte = Int(parts[i + 1], radix: 16) else {
                            break
                        }
                        
                        // Skip if both bytes are 0 (no DTC)
                        if firstByte == 0 && secondByte == 0 {
                            i += 2
                            continue
                        }
                        
                        // Extract DTC
                        let dtc = decodeDTC(firstByte: firstByte, secondByte: secondByte)
                        if !dtc.isEmpty {
                            dtcs.append(dtc)
                        }
                        
                        i += 2
                    }
                }
            }
        } catch {
            os_log("DTC parsing error: %{public}@", log: logger, type: .error, error.localizedDescription)
        }
        
        return dtcs
    }
    
    private func decodeDTC(firstByte: Int, secondByte: Int) -> String {
        do {
            // Extract DTC type from first byte
            let typeValue = (firstByte & 0xC0) >> 6
            let type: String
            switch typeValue {
            case 0: type = "P" // Powertrain
            case 1: type = "C" // Chassis
            case 2: type = "B" // Body
            case 3: type = "U" // Network
            default: type = "P" // Default to Powertrain
            }
            
            // Extract remaining digits
            let digit1 = (firstByte & 0x30) >> 4
            let digit2 = firstByte & 0x0F
            let digit3 = (secondByte & 0xF0) >> 4
            let digit4 = secondByte & 0x0F
            
            // Format DTC
            return String(format: "%@%d%d%d%d", type, digit1, digit2, digit3, digit4)
        } catch {
            os_log("DTC decode error: %{public}@", log: logger, type: .error, error.localizedDescription)
            return ""
        }
    }
    
    private func parseReadinessStatus(response: String) -> (Bool, [String]) {
        var incompleteTests: [String] = []
        var ready = true
        
        do {
            // Split response into lines
            let lines = response.components(separatedBy: CharacterSet(charactersIn: "\r\n")).filter { !$0.isEmpty }
            
            for line in lines {
                // Skip echo and prompt
                if line == "0101" || line == ">" {
                    continue
                }
                
                // Check if line starts with 41 01 (response to mode 01, PID 01)
                if line.hasPrefix("41 01") {
                    // Extract readiness bytes
                    let parts = line.components(separatedBy: " ")
                    if parts.count >= 4 {
                        // Byte A contains MIL status and DTC count
                        let byteA = Int(parts[2], radix: 16) ?? 0
                        
                        // Byte B contains readiness test status
                        let byteB = Int(parts[3], radix: 16) ?? 0
                        
                        // Check if MIL is on
                        let milOn = (byteA & 0x80) != 0
                        if milOn {
                            ready = false
                            incompleteTests.append("MIL is ON")
                        }
                        
                        // Check readiness tests
                        let tests = [
                            "Misfire": (byteB & 0x01) != 0,
                            "Fuel System": (byteB & 0x02) != 0,
                            "Components": (byteB & 0x04) != 0
                            // Add more tests as needed
                        ]
                        
                        for (test, incomplete) in tests {
                            if incomplete {
                                ready = false
                                incompleteTests.append(test)
                            }
                        }
                    }
                }
            }
        } catch {
            os_log("Readiness parsing error: %{public}@", log: logger, type: .error, error.localizedDescription)
            ready = false
            incompleteTests.append("Parsing error")
        }
        
        return (ready, incompleteTests)
    }
    
    private func parseVIN(response: String) -> String? {
        do {
            // Split response into lines
            let lines = response.components(separatedBy: CharacterSet(charactersIn: "\r\n")).filter { !$0.isEmpty }
            
            var vinHex = ""
            
            for line in lines {
                // Skip echo and prompt
                if line == "0902" || line == ">" {
                    continue
                }
                
                // Check if line starts with 49 02 (response to mode 09, PID 02)
                if line.hasPrefix("49 02") {
                    // Extract VIN bytes
                    let parts = line.components(separatedBy: " ")
                    
                    // Skip the first 3 parts (49 02 01)
                    for i in 3..<parts.count {
                        vinHex += parts[i]
                    }
                }
            }
            
            // Convert hex to ASCII
            if !vinHex.isEmpty {
                var bytes: [UInt8] = []
                var i = 0
                while i < vinHex.count {
                    let startIndex = vinHex.index(vinHex.startIndex, offsetBy: i)
                    let endIndex = vinHex.index(startIndex, offsetBy: 2, limitedBy: vinHex.endIndex) ?? vinHex.endIndex
                    let hexByte = String(vinHex[startIndex..<endIndex])
                    if let byte = UInt8(hexByte, radix: 16) {
                        bytes.append(byte)
                    }
                    i += 2
                }
                return String(bytes: bytes, encoding: .ascii)
            }
        } catch {
            os_log("VIN parsing error: %{public}@", log: logger, type: .error, error.localizedDescription)
        }
        
        return nil
    }
    
    private func parseSupportedPIDs(mode: Int, range: Int, response: String) -> [Int] {
        var supportedPIDs: [Int] = []
        
        do {
            // Split response into lines
            let lines = response.components(separatedBy: CharacterSet(charactersIn: "\r\n")).filter { !$0.isEmpty }
            
            for line in lines {
                // Skip echo and prompt
                if line == String(format: "%02X%02X", mode, range) || line == ">" {
                    continue
                }
                
                // Check if line starts with the expected response
                let expectedPrefix = String(format: "%02X %02X", mode + 0x40, range)
                if line.hasPrefix(expectedPrefix) {
                    // Extract data bytes
                    let parts = line.components(separatedBy: " ")
                    if parts.count >= 6 {
                        // Convert 4 data bytes to 32-bit integer
                        let a = Int(parts[2], radix: 16) ?? 0
                        let b = Int(parts[3], radix: 16) ?? 0
                        let c = Int(parts[4], radix: 16) ?? 0
                        let d = Int(parts[5], radix: 16) ?? 0
                        let bits = (UInt32(a) << 24) | (UInt32(b) << 16) | (UInt32(c) << 8) | UInt32(d)
                        
                        // Check each bit
                        for i in 0...31 {
                            if ((bits & (1 << (31 - i))) != 0) {
                                supportedPIDs.append(range + i + 1)
                            }
                        }
                    }
                }
            }
        } catch {
            os_log("Supported PIDs parsing error: %{public}@", log: logger, type: .error, error.localizedDescription)
        }
        
        return supportedPIDs
    }
    
    private func getProtocolName(protocol: Int) -> String {
        switch protocol {
        case PROTOCOL_AUTO: return "Auto"
        case PROTOCOL_ISO9141_5BAUD: return "ISO9141-2 (5 baud init)"
        case PROTOCOL_ISO14230_5BAUD: return "ISO14230-4 KWP (5 baud init)"
        case PROTOCOL_ISO14230_FAST: return "ISO14230-4 KWP (fast init)"
        case PROTOCOL_ISO15765_11BIT_500K: return "ISO15765-4 CAN (11-bit, 500K)"
        case PROTOCOL_ISO15765_29BIT_500K: return "ISO15765-4 CAN (29-bit, 500K)"
        case PROTOCOL_ISO15765_11BIT_250K: return "ISO15765-4 CAN (11-bit, 250K)"
        case PROTOCOL_ISO15765_29BIT_250K: return "ISO15765-4 CAN (29-bit, 250K)"
        default: return "Unknown"
        }
    }
    
    private func executeCommandsSequentially(commands: [String], completion: @escaping (Bool) -> Void) {
        guard !commands.isEmpty, isConnected, let connection = self.connection else {
            completion(false)
            return
        }
        
        var remainingCommands = commands
        let command = remainingCommands.removeFirst()
        
        // Create response collector
        let responseCollector = ResponseCollector(timeout: TimeInterval(responseTimeout) / 1000.0)
        
        // Register collector
        objc_sync_enter(responseCollectors)
        responseCollectors[command] = responseCollector
        objc_sync_exit(responseCollectors)
        
        // Send command
        let fullCommand = command + COMMAND_TERMINATOR
        let data = Data(fullCommand.utf8)
        
        connection.send(content: data, completion: .contentProcessed { [weak self] error in
            guard let self = self else {
                completion(false)
                return
            }
            
            if let error = error {
                os_log("Command error: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: command)
                objc_sync_exit(self.responseCollectors)
                
                completion(false)
                return
            }
            
            // Log command
            os_log("Sent command: %{public}@", log: self.logger, type: .debug, command)
            
            // Wait for response
            DispatchQueue.global(qos: .userInitiated).async {
                let response = responseCollector.waitForResponse()
                
                // Unregister collector
                objc_sync_enter(self.responseCollectors)
                self.responseCollectors.removeValue(forKey: command)
                objc_sync_exit(self.responseCollectors)
                
                // Check for timeout
                if response == nil {
                    completion(false)
                    return
                }
                
                // Continue with remaining commands
                if remainingCommands.isEmpty {
                    completion(true)
                } else {
                    self.executeCommandsSequentially(commands: remainingCommands, completion: completion)
                }
            }
        })
    }
    
    private func initializeDtcDatabase() {
        // This is a simplified DTC database with a few common codes
        // In a real implementation, this would be much more comprehensive
        dtcDatabase["P0100"] = ("Mass or Volume Air Flow Circuit Malfunction", "medium")
        dtcDatabase["P0101"] = ("Mass or Volume Air Flow Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0102"] = ("Mass or Volume Air Flow Circuit Low Input", "medium")
        dtcDatabase["P0103"] = ("Mass or Volume Air Flow Circuit High Input", "medium")
        dtcDatabase["P0104"] = ("Mass or Volume Air Flow Circuit Intermittent", "medium")
        dtcDatabase["P0105"] = ("Manifold Absolute Pressure/Barometric Pressure Circuit Malfunction", "medium")
        dtcDatabase["P0106"] = ("Manifold Absolute Pressure/Barometric Pressure Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0107"] = ("Manifold Absolute Pressure/Barometric Pressure Circuit Low Input", "medium")
        dtcDatabase["P0108"] = ("Manifold Absolute Pressure/Barometric Pressure Circuit High Input", "medium")
        dtcDatabase["P0109"] = ("Manifold Absolute Pressure/Barometric Pressure Circuit Intermittent", "medium")
        dtcDatabase["P0110"] = ("Intake Air Temperature Circuit Malfunction", "low")
        dtcDatabase["P0111"] = ("Intake Air Temperature Circuit Range/Performance Problem", "low")
        dtcDatabase["P0112"] = ("Intake Air Temperature Circuit Low Input", "low")
        dtcDatabase["P0113"] = ("Intake Air Temperature Circuit High Input", "low")
        dtcDatabase["P0114"] = ("Intake Air Temperature Circuit Intermittent", "low")
        dtcDatabase["P0115"] = ("Engine Coolant Temperature Circuit Malfunction", "medium")
        dtcDatabase["P0116"] = ("Engine Coolant Temperature Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0117"] = ("Engine Coolant Temperature Circuit Low Input", "medium")
        dtcDatabase["P0118"] = ("Engine Coolant Temperature Circuit High Input", "medium")
        dtcDatabase["P0119"] = ("Engine Coolant Temperature Circuit Intermittent", "medium")
        dtcDatabase["P0120"] = ("Throttle Position Sensor/Switch A Circuit Malfunction", "medium")
        dtcDatabase["P0121"] = ("Throttle Position Sensor/Switch A Circuit Range/Performance Problem", "medium")
        dtcDatabase["P0122"] = ("Throttle Position Sensor/Switch A Circuit Low Input", "medium")
        dtcDatabase["P0123"] = ("Throttle Position Sensor/Switch A Circuit High Input", "medium")
        dtcDatabase["P0124"] = ("Throttle Position Sensor/Switch A Circuit Intermittent", "medium")
        dtcDatabase["P0125"] = ("Insufficient Coolant Temperature for Closed Loop Fuel Control", "low")
        dtcDatabase["P0126"] = ("Insufficient Coolant Temperature for Stable Operation", "low")
        dtcDatabase["P0127"] = ("Intake Air Temperature Too High", "low")
        dtcDatabase["P0128"] = ("Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)", "low")
        dtcDatabase["P0129"] = ("Barometric Pressure Too Low", "low")
        dtcDatabase["P0130"] = ("O2 Sensor Circuit Malfunction (Bank 1 Sensor 1)", "medium")
        // Add more codes as needed
    }
}

// MARK: - Response Collector

class ResponseCollector {
    private var response: String?
    private let semaphore = DispatchSemaphore(value: 0)
    private let timeout: TimeInterval
    
    init(timeout: TimeInterval) {
        self.timeout = timeout
    }
    
    func addResponse(response: String) {
        self.response = response
        semaphore.signal()
    }
    
    func waitForResponse() -> String? {
        let result = semaphore.wait(timeout: .now() + timeout)
        if result == .timedOut {
            return nil
        }
        return response
    }
}
```

## Socket Communication

The iOS implementation uses Apple's Network framework for socket communication:

1. **Connection Establishment**:
   - Uses `NWConnection` to establish a TCP connection to the specified IP address and port
   - Handles connection state changes through the `stateUpdateHandler`
   - Implements connection timeout handling

2. **Command Transmission**:
   - Sends commands with proper termination characters
   - Uses completion handlers to track command status
   - Provides both raw command and structured PID request methods

3. **Response Processing**:
   - Continuously receives data from the socket
   - Collects responses until the prompt character is received
   - Routes responses to the appropriate command handlers
   - Parses responses based on command type

4. **Connection Management**:
   - Monitors connection state through the Network framework
   - Handles disconnection and cleanup
   - Provides reconnection capabilities

## Protocol Handling

The iOS implementation supports all seven OBD-II protocols through the following mechanisms:

1. **Protocol Selection**:
   - Allows automatic protocol detection (default)
   - Supports manual protocol selection
   - Sets protocol during initialization with the `ATSP` command

2. **Protocol-Specific Behavior**:
   - Handles different response formats based on protocol
   - Adjusts timing parameters for different protocols
   - Manages protocol-specific initialization sequences

3. **Protocol Constants**:
   - Defines constants for all supported protocols
   - Maps protocol numbers to human-readable names
   - Provides protocol information in connection status

## Event Emission

The iOS implementation uses React Native's event emitter system to communicate asynchronous events to JavaScript:

1. **Event Types**:
   - `data`: Vehicle data received from the adapter
   - `error`: Communication or protocol errors
   - `status`: Module status updates
   - `connection`: Connection state changes
   - `log`: Debugging information

2. **Event Structure**:
   - Timestamp for when the event occurred
   - Event type for categorization
   - Message for human-readable description
   - Optional structured data for programmatic processing

3. **Event Handling**:
   - Extends `RCTEventEmitter` for event emission
   - Tracks listener count to optimize resource usage
   - Automatically stops monitoring when no listeners remain
   - Provides methods for adding and removing listeners

In the next section, we'll explore WiFi connection management in more detail.
# 8. WiFi Connection Management

This section explores the strategies and techniques for managing WiFi connections to OBD-II adapters, focusing on reliability, error handling, and user experience.

## Discovering and Connecting to the ZAKVOP Adapter

The ZAKVOP OBD2 scanner, like most WiFi OBD adapters, operates as a WiFi access point. This means it creates its own WiFi network that your mobile device must connect to before the application can communicate with it.

### Network Configuration

1. **Access Point Details**:
   - SSID: Typically starts with "OBDII" or similar (check your adapter documentation)
   - Password: May have a default password or none (check your adapter documentation)
   - IP Address: Typically 192.168.0.10 (ZAKVOP default)
   - Port: Typically 35000 (ZAKVOP default)

2. **Connection Process**:

   a. **Device WiFi Connection**:
   ```
   User's mobile device must connect to the OBD adapter's WiFi network
   ```

   b. **Application Socket Connection**:
   ```
   Application establishes TCP socket connection to adapter's IP and port
   ```

### Connection Workflow

Here's a recommended workflow for connecting to the ZAKVOP adapter:

1. **Pre-Connection Checks**:
   - Check if WiFi is enabled on the device
   - Check if the device is connected to the correct WiFi network
   - If not, prompt the user to connect to the adapter's WiFi network

2. **Connection Attempt**:
   - Attempt to establish a TCP socket connection to the adapter's IP and port
   - Use appropriate timeout values (10 seconds is a good starting point)
   - Handle connection errors gracefully

3. **Post-Connection Initialization**:
   - Send initialization commands (ATZ, ATE0, etc.)
   - Verify adapter response
   - Configure protocol settings

### Implementation Example

Here's how you might implement this workflow in your React Native application:

```javascript
import ObdWiFi from 'react-native-obd-wifi';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

async function connectToAdapter() {
  try {
    // Check WiFi status
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected || netInfo.type !== 'wifi') {
      Alert.alert(
        'WiFi Not Connected',
        'Please connect your device to the OBD adapter WiFi network (typically named "OBDII_...")',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open WiFi Settings', 
            onPress: () => {
              // Open WiFi settings
              // On Android: IntentLauncher.startActivityAsync('android.settings.WIFI_SETTINGS')
              // On iOS: Linking.openURL('App-Prefs:root=WIFI')
            } 
          }
        ]
      );
      return false;
    }
    
    // Check if connected to the correct WiFi network (optional)
    if (netInfo.details && netInfo.details.ssid && !netInfo.details.ssid.startsWith('OBDII')) {
      Alert.alert(
        'Wrong WiFi Network',
        `You're connected to "${netInfo.details.ssid}" instead of the OBD adapter network. Please connect to the OBD adapter WiFi.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open WiFi Settings', 
            onPress: () => {
              // Open WiFi settings
            } 
          }
        ]
      );
      return false;
    }
    
    // Attempt connection to adapter
    const connected = await ObdWiFi.connect({
      ipAddress: '192.168.0.10', // ZAKVOP default
      port: 35000, // ZAKVOP default
      autoConnect: true, // Automatically reconnect if connection is lost
      connectionTimeout: 10000, // 10 seconds
      responseTimeout: 5000, // 5 seconds
      protocol: 0 // Auto-detect protocol
    });
    
    if (connected) {
      // Initialize connection
      const initialized = await ObdWiFi.initializeConnection();
      
      if (initialized) {
        console.log('Successfully connected and initialized OBD adapter');
        return true;
      } else {
        console.error('Failed to initialize OBD adapter');
        Alert.alert('Connection Error', 'Connected to adapter but failed to initialize communication.');
        return false;
      }
    } else {
      console.error('Failed to connect to OBD adapter');
      Alert.alert('Connection Error', 'Failed to connect to the OBD adapter. Please check that your device is connected to the adapter\'s WiFi network.');
      return false;
    }
  } catch (error) {
    console.error('Error connecting to OBD adapter:', error);
    Alert.alert('Connection Error', `Error: ${error.message}`);
    return false;
  }
}
```

## Handling Connection States

Robust connection state management is crucial for a good user experience. Your application should track and respond to different connection states.

### Connection State Machine

Consider implementing a state machine for connection management:

1. **Disconnected**: No connection to the adapter
   - User can initiate connection
   - Application shows connection instructions

2. **Connecting**: Attempting to establish connection
   - Show progress indicator
   - Allow cancellation
   - Handle timeout

3. **Connected**: Socket connection established
   - Show connected status
   - Enable communication features
   - Monitor connection health

4. **Initializing**: Sending setup commands
   - Show initialization progress
   - Handle initialization errors

5. **Ready**: Fully connected and initialized
   - Enable all features
   - Begin data collection if needed

6. **Error**: Connection error occurred
   - Show error details
   - Provide troubleshooting guidance
   - Allow retry

### State Transitions

Here's a diagram of the possible state transitions:

```
                  +------------+
                  |            |
                  | Disconnected |
                  |            |
                  +-----+------+
                        |
                        | User initiates connection
                        v
                  +------------+
                  |            |
                  | Connecting |
                  |            |
                  +-----+------+
                        |
                        | Socket connected
                        v
                  +------------+     Connection lost     +------------+
                  |            +--------------------->  |            |
                  |  Connected |                        |   Error    |
                  |            | <--------------------+ |            |
                  +-----+------+     Retry connection   +------------+
                        |
                        | Begin initialization
                        v
                  +------------+
                  |            |
                  | Initializing|
                  |            |
                  +-----+------+
                        |
                        | Initialization complete
                        v
                  +------------+
                  |            |
                  |   Ready    |
                  |            |
                  +------------+
```

### Implementation Example

Here's how you might implement connection state management in your React Native application:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import ObdWiFi from 'react-native-obd-wifi';

// Connection states
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error'
};

function ObdConnectionManager() {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Set up event listener for connection events
  useEffect(() => {
    const subscription = ObdWiFi.addListener((event) => {
      if (event.type === 'connection') {
        if (event.message.includes('Connected')) {
          setConnectionState(CONNECTION_STATES.CONNECTED);
          initializeConnection();
        } else if (event.message.includes('Disconnected')) {
          setConnectionState(CONNECTION_STATES.DISCONNECTED);
        }
      } else if (event.type === 'error') {
        setErrorMessage(event.message);
        setConnectionState(CONNECTION_STATES.ERROR);
      } else if (event.type === 'status') {
        if (event.message.includes('initialized')) {
          setConnectionState(CONNECTION_STATES.READY);
        }
      }
    });
    
    // Check initial connection state
    checkConnectionState();
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Check current connection state
  async function checkConnectionState() {
    try {
      const isConnected = await ObdWiFi.isConnected();
      if (isConnected) {
        const isInitialized = await checkIfInitialized();
        setConnectionState(isInitialized ? CONNECTION_STATES.READY : CONNECTION_STATES.CONNECTED);
      } else {
        setConnectionState(CONNECTION_STATES.DISCONNECTED);
      }
    } catch (error) {
      console.error('Error checking connection state:', error);
      setConnectionState(CONNECTION_STATES.ERROR);
      setErrorMessage(error.message);
    }
  }
  
  // Check if adapter is initialized
  async function checkIfInitialized() {
    try {
      // This is a simplified check - in a real app, you might
      // send a simple command and check for valid response
      const response = await ObdWiFi.sendCommand('AT');
      return response === true;
    } catch (error) {
      return false;
    }
  }
  
  // Initialize connection
  async function initializeConnection() {
    try {
      setConnectionState(CONNECTION_STATES.INITIALIZING);
      const initialized = await ObdWiFi.initializeConnection();
      
      if (initialized) {
        setConnectionState(CONNECTION_STATES.READY);
      } else {
        setConnectionState(CONNECTION_STATES.ERROR);
        setErrorMessage('Failed to initialize adapter');
      }
    } catch (error) {
      setConnectionState(CONNECTION_STATES.ERROR);
      setErrorMessage(error.message);
    }
  }
  
  // Connect to adapter
  async function connect() {
    try {
      setConnectionState(CONNECTION_STATES.CONNECTING);
      setErrorMessage('');
      
      const connected = await ObdWiFi.connect({
        ipAddress: '192.168.0.10',
        port: 35000,
        autoConnect: true,
        connectionTimeout: 10000,
        responseTimeout: 5000,
        protocol: 0
      });
      
      if (!connected) {
        setConnectionState(CONNECTION_STATES.ERROR);
        setErrorMessage('Failed to connect to adapter');
      }
      // State will be updated by event listener
    } catch (error) {
      setConnectionState(CONNECTION_STATES.ERROR);
      setErrorMessage(error.message);
    }
  }
  
  // Disconnect from adapter
  async function disconnect() {
    try {
      await ObdWiFi.disconnect();
      // State will be updated by event listener
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }
  
  // Render UI based on connection state
  function renderConnectionUI() {
    switch (connectionState) {
      case CONNECTION_STATES.DISCONNECTED:
        return (
          <View>
            <Text>Not connected to OBD adapter</Text>
            <Button title="Connect" onPress={connect} />
          </View>
        );
        
      case CONNECTION_STATES.CONNECTING:
        return (
          <View>
            <Text>Connecting to OBD adapter...</Text>
            <ActivityIndicator size="small" />
            <Button title="Cancel" onPress={disconnect} />
          </View>
        );
        
      case CONNECTION_STATES.CONNECTED:
        return (
          <View>
            <Text>Connected to OBD adapter</Text>
            <Text>Initializing...</Text>
            <ActivityIndicator size="small" />
            <Button title="Disconnect" onPress={disconnect} />
          </View>
        );
        
      case CONNECTION_STATES.INITIALIZING:
        return (
          <View>
            <Text>Initializing OBD adapter...</Text>
            <ActivityIndicator size="small" />
            <Button title="Disconnect" onPress={disconnect} />
          </View>
        );
        
      case CONNECTION_STATES.READY:
        return (
          <View>
            <Text>Connected and ready</Text>
            <Button title="Disconnect" onPress={disconnect} />
          </View>
        );
        
      case CONNECTION_STATES.ERROR:
        return (
          <View>
            <Text>Connection Error</Text>
            <Text>{errorMessage}</Text>
            <Button title="Retry" onPress={connect} />
          </View>
        );
        
      default:
        return null;
    }
  }
  
  return (
    <View>
      <Text>OBD Connection Status</Text>
      {renderConnectionUI()}
    </View>
  );
}
```

## Reconnection Strategies

Network connections can be unstable, especially in automotive environments. Implementing robust reconnection strategies is essential.

### Automatic Reconnection

1. **Detect Disconnection**:
   - Monitor socket state
   - Detect timeouts and errors
   - Identify when connection is lost

2. **Reconnection Attempts**:
   - Implement exponential backoff
   - Limit maximum retry attempts
   - Notify user of reconnection status

3. **State Preservation**:
   - Maintain session state during reconnection
   - Resume operations after successful reconnection
   - Handle partial data gracefully

### Implementation Example

Here's how you might implement automatic reconnection:

```javascript
class ObdReconnectionManager {
  constructor() {
    this.maxRetries = 5;
    this.retryCount = 0;
    this.baseDelay = 1000; // 1 second
    this.reconnecting = false;
    this.connectionParams = null;
  }
  
  // Set connection parameters
  setConnectionParams(params) {
    this.connectionParams = params;
  }
  
  // Start monitoring for disconnection
  startMonitoring() {
    this.subscription = ObdWiFi.addListener((event) => {
      if (event.type === 'error' && 
          (event.message.includes('disconnected') || 
           event.message.includes('connection lost'))) {
        this.handleDisconnection();
      }
    });
  }
  
  // Stop monitoring
  stopMonitoring() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
  
  // Handle disconnection event
  async handleDisconnection() {
    if (this.reconnecting || !this.connectionParams) {
      return;
    }
    
    this.reconnecting = true;
    this.retryCount = 0;
    
    while (this.retryCount < this.maxRetries) {
      // Calculate delay with exponential backoff
      const delay = this.baseDelay * Math.pow(2, this.retryCount);
      
      console.log(`Reconnection attempt ${this.retryCount + 1} in ${delay}ms`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        // Attempt reconnection
        const connected = await ObdWiFi.connect(this.connectionParams);
        
        if (connected) {
          console.log('Reconnection successful');
          
          // Reinitialize if needed
          const initialized = await ObdWiFi.initializeConnection();
          
          if (initialized) {
            console.log('Reinitialization successful');
            this.reconnecting = false;
            this.retryCount = 0;
            return true;
          }
        }
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
      }
      
      this.retryCount++;
    }
    
    console.error('Reconnection failed after maximum attempts');
    this.reconnecting = false;
    return false;
  }
  
  // Reset reconnection state
  reset() {
    this.reconnecting = false;
    this.retryCount = 0;
  }
}
```

## Connection Troubleshooting

Even with robust connection management, users may encounter issues. Providing troubleshooting guidance can improve the user experience.

### Common Connection Issues

1. **WiFi Connection Problems**:
   - User connected to wrong WiFi network
   - Weak signal between device and adapter
   - Adapter power issues

2. **Socket Connection Problems**:
   - Incorrect IP address or port
   - Firewall or security software blocking connection
   - Adapter already connected to another device

3. **Protocol Issues**:
   - Vehicle using unsupported protocol
   - Adapter firmware incompatibility
   - Initialization sequence failure

### Troubleshooting Guide

Provide users with a troubleshooting guide for common issues:

```javascript
function showTroubleshootingGuide() {
  Alert.alert(
    'Connection Troubleshooting',
    'Please try the following steps:\n\n' +
    '1. Ensure the OBD adapter is properly plugged into your vehicle\'s OBD port\n\n' +
    '2. Check that your device is connected to the adapter\'s WiFi network (usually named "OBDII_...")\n\n' +
    '3. Verify that your vehicle\'s ignition is on\n\n' +
    '4. Try unplugging the adapter, waiting 10 seconds, and plugging it back in\n\n' +
    '5. Restart your device\'s WiFi by turning it off and on\n\n' +
    '6. If using Android, ensure location services are enabled (required for WiFi scanning)\n\n' +
    '7. Try moving your device closer to the adapter\n\n' +
    '8. If all else fails, try resetting the adapter according to manufacturer instructions',
    [{ text: 'OK' }]
  );
}
```

### Diagnostic Information

Collect and display diagnostic information to help users troubleshoot:

```javascript
async function showDiagnosticInfo() {
  try {
    // Get network info
    const netInfo = await NetInfo.fetch();
    
    // Get adapter status if connected
    let adapterStatus = 'Not connected';
    try {
      if (await ObdWiFi.isConnected()) {
        const status = await ObdWiFi.getConnectionStatus();
        adapterStatus = JSON.stringify(status, null, 2);
      }
    } catch (error) {
      adapterStatus = `Error getting status: ${error.message}`;
    }
    
    // Display diagnostic info
    Alert.alert(
      'Diagnostic Information',
      `Network Information:\n` +
      `- Connected: ${netInfo.isConnected}\n` +
      `- Type: ${netInfo.type}\n` +
      `- WiFi Enabled: ${netInfo.isWifiEnabled}\n` +
      (netInfo.details ? `- SSID: ${netInfo.details.ssid || 'Unknown'}\n` : '') +
      (netInfo.details ? `- BSSID: ${netInfo.details.bssid || 'Unknown'}\n` : '') +
      (netInfo.details ? `- Strength: ${netInfo.details.strength || 'Unknown'}\n` : '') +
      `\nAdapter Status:\n${adapterStatus}`,
      [
        { text: 'Copy to Clipboard', onPress: () => {/* Copy to clipboard logic */} },
        { text: 'OK' }
      ]
    );
  } catch (error) {
    Alert.alert('Error', `Failed to get diagnostic information: ${error.message}`);
  }
}
```

In the next section, we'll explore the implementation of OBD-II protocols in detail.
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
    const rpm = await requestPID(PIDs.ENGINE_RPM);
    console.log(`${rpm.name}: ${rpm.value} ${rpm.unit}`);
    
    // Get vehicle speed
    const speed = await requestPID(PIDs.VEHICLE_SPEED);
    console.log(`${speed.name}: ${speed.value} ${speed.unit}`);
    
    // Get coolant temperature
    const coolant = await requestPID(PIDs.COOLANT_TEMP);
    console.log(`${coolant.name}: ${coolant.value} ${coolant.unit}`);
    
    // Get multiple values efficiently
    const values = await ObdWiFi.getMultipleSensorValues([
      { mode: PIDs.THROTTLE_POS.mode, pid: PIDs.THROTTLE_POS.pid },
      { mode: PIDs.FUEL_LEVEL.mode, pid: PIDs.FUEL_LEVEL.pid },
      { mode: PIDs.INTAKE_TEMP.mode, pid: PIDs.INTAKE_TEMP.pid }
    ]);
    
    // Process multiple values
    console.log('Multiple sensor values:', values);
    
    return {
      rpm: rpm.value,
      speed: speed.value,
      coolantTemp: coolant.value,
      throttlePos: values[`${PIDs.THROTTLE_POS.mode}:${PIDs.THROTTLE_POS.pid}`],
      fuelLevel: values[`${PIDs.FUEL_LEVEL.mode}:${PIDs.FUEL_LEVEL.pid}`],
      intakeTemp: values[`${PIDs.INTAKE_TEMP.mode}:${PIDs.INTAKE_TEMP.pid}`]
    };
  } catch (error) {
    console.error('Error getting vehicle data:', error);
    return null;
  }
}
```

## Data Parsing and Interpretation

Parsing OBD-II data requires understanding the format and conversion formulas for each parameter.

### Common Parameter Formulas

Here are the formulas for some common parameters:

| Parameter | PID | Formula | Units |
|-----------|-----|---------|-------|
| Engine RPM | 0x0C | ((A * 256) + B) / 4 | RPM |
| Vehicle Speed | 0x0D | A | km/h |
| Coolant Temperature | 0x05 | A - 40 | °C |
| Intake Temperature | 0x0F | A - 40 | °C |
| MAF Air Flow Rate | 0x10 | ((A * 256) + B) / 100 | g/s |
| Throttle Position | 0x11 | (A * 100) / 255 | % |
| Fuel Level | 0x2F | (A * 100) / 255 | % |
| Distance with MIL on | 0x21 | (A * 256) + B | km |

### Comprehensive PID Library

For a production application, you should implement a comprehensive PID library:

```javascript
// PID library with parsing functions
const PIDLibrary = {
  // Mode 01 - Current Data
  '01': {
    '00': {
      name: 'Supported PIDs (01-20)',
      parse: (data) => {
        if (data.length < 4) return null;
        const bits = (parseInt(data[0], 16) << 24) | 
                     (parseInt(data[1], 16) << 16) | 
                     (parseInt(data[2], 16) << 8) | 
                     parseInt(data[3], 16);
        const supported = [];
        for (let i = 0; i < 32; i++) {
          if ((bits >> (31 - i)) & 1) {
            supported.push(i + 1);
          }
        }
        return supported;
      },
      unit: ''
    },
    '01': {
      name: 'Monitor status since DTCs cleared',
      parse: (data) => {
        if (data.length < 4) return null;
        const a = parseInt(data[0], 16);
        const b = parseInt(data[1], 16);
        const c = parseInt(data[2], 16);
        const d = parseInt(data[3], 16);
        
        return {
          mil: (a & 0x80) !== 0,
          dtcCount: a & 0x7F,
          misfire: {
            available: (b & 0x01) !== 0,
            incomplete: (c & 0x01) !== 0
          },
          fuelSystem: {
            available: (b & 0x02) !== 0,
            incomplete: (c & 0x02) !== 0
          },
          components: {
            available: (b & 0x04) !== 0,
            incomplete: (c & 0x04) !== 0
          }
          // Additional monitors could be added here
        };
      },
      unit: ''
    },
    '04': {
      name: 'Calculated Engine Load',
      parse: (data) => {
        if (data.length < 1) return null;
        return (parseInt(data[0], 16) * 100) / 255;
      },
      unit: '%'
    },
    '05': {
      name: 'Engine Coolant Temperature',
      parse: (data) => {
        if (data.length < 1) return null;
        return parseInt(data[0], 16) - 40;
      },
      unit: '°C'
    },
    '0C': {
      name: 'Engine RPM',
      parse: (data) => {
        if (data.length < 2) return null;
        return ((parseInt(data[0], 16) * 256) + parseInt(data[1], 16)) / 4;
      },
      unit: 'rpm'
    },
    '0D': {
      name: 'Vehicle Speed',
      parse: (data) => {
        if (data.length < 1) return null;
        return parseInt(data[0], 16);
      },
      unit: 'km/h'
    },
    '0F': {
      name: 'Intake Air Temperature',
      parse: (data) => {
        if (data.length < 1) return null;
        return parseInt(data[0], 16) - 40;
      },
      unit: '°C'
    },
    '10': {
      name: 'MAF Air Flow Rate',
      parse: (data) => {
        if (data.length < 2) return null;
        return ((parseInt(data[0], 16) * 256) + parseInt(data[1], 16)) / 100;
      },
      unit: 'g/s'
    },
    '11': {
      name: 'Throttle Position',
      parse: (data) => {
        if (data.length < 1) return null;
        return (parseInt(data[0], 16) * 100) / 255;
      },
      unit: '%'
    },
    // Add more PIDs as needed
  },
  
  // Mode 03 - Diagnostic Trouble Codes
  '03': {
    parse: (response) => {
      const dtcs = [];
      const lines = response.split('\r');
      
      for (const line of lines) {
        if (line.startsWith('43')) {
          const parts = line.split(' ');
          
          // Process pairs of bytes (each DTC is 2 bytes)
          let i = 1; // Skip the "43" prefix
          while (i < parts.length - 1) {
            const firstByte = parseInt(parts[i], 16);
            const secondByte = parseInt(parts[i + 1], 16);
            
            // Skip if both bytes are 0 (no DTC)
            if (firstByte === 0 && secondByte === 0) {
              i += 2;
              continue;
            }
            
            // Extract DTC
            const dtc = decodeDTC(firstByte, secondByte);
            if (dtc) {
              dtcs.push(dtc);
            }
            
            i += 2;
          }
        }
      }
      
      return dtcs;
    }
  },
  
  // Mode 09 - Vehicle Information
  '09': {
    '02': {
      name: 'Vehicle Identification Number',
      parse: (response) => {
        // VIN parsing is more complex as it spans multiple lines
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
      },
      unit: ''
    }
    // Add more PIDs as needed
  }
};

// Helper function to decode DTC
function decodeDTC(firstByte, secondByte) {
  // Extract DTC type from first byte
  let type;
  switch ((firstByte & 0xC0) >> 6) {
    case 0: type = 'P'; break; // Powertrain
    case 1: type = 'C'; break; // Chassis
    case 2: type = 'B'; break; // Body
    case 3: type = 'U'; break; // Network
    default: type = 'P'; break;
  }
  
  // Extract remaining digits
  const digit1 = (firstByte & 0x30) >> 4;
  const digit2 = firstByte & 0x0F;
  const digit3 = (secondByte & 0xF0) >> 4;
  const digit4 = secondByte & 0x0F;
  
  // Format DTC
  return `${type}${digit1}${digit2}${digit3}${digit4}`;
}

// Function to parse OBD response using the PID library
function parseOBDResponse(mode, pid, response) {
  if (!response) return null;
  
  // Split response into parts
  const parts = response.split(' ');
  
  // Check if response is valid
  const expectedMode = (parseInt(mode, 16) + 0x40).toString(16).toUpperCase().padStart(2, '0');
  
  if (parts.length < 2 || parts[0] !== expectedMode) {
    console.warn('Invalid response format:', response);
    return null;
  }
  
  // For mode 03 (DTCs), handle differently
  if (mode === '03') {
    return PIDLibrary['03'].parse(response);
  }
  
  // For other modes, check if PID exists in library
  if (PIDLibrary[mode] && PIDLibrary[mode][pid]) {
    const pidInfo = PIDLibrary[mode][pid];
    
    // Extract data bytes (skip mode and PID)
    const data = parts.slice(2);
    
    // Parse data using the PID-specific parser
    const value = pidInfo.parse(data);
    
    return {
      name: pidInfo.name,
      value: value,
      unit: pidInfo.unit,
      rawResponse: response
    };
  }
  
  // If PID not found in library, return raw response
  return {
    name: `Mode ${mode} PID ${pid}`,
    value: parts.slice(2).join(' '),
    unit: '',
    rawResponse: response
  };
}
```

In the next section, we'll explore error handling strategies for robust OBD-II communication.
# Comprehensive Guide Structure: AI Vehicle Assistant with React Native OBD-II WiFi Module

## 1. Introduction
- Purpose of the guide
- Overview of the AI vehicle assistant concept
- Why native modules are necessary for OBD-II communication
- Benefits of using Turbo Modules approach

## 2. Prerequisites
- React Native development environment setup
- Native development basics (Android/iOS)
- OBD-II and ELM327 fundamentals
- ZAKVOP OBD2 scanner specifications and capabilities
- Node.js & npm/yarn

## 3. Core Concepts
- Turbo Modules & Codegen explanation
- OBD-II protocols supported by ZAKVOP (all 7 protocols)
- WiFi communication principles with OBD adapters
- AI diagnostic principles and implementation approach

## 4. Module Specification (TypeScript)
- Defining the module interface
- Data structures for OBD-II communication
- Event handling for asynchronous data
- Error handling strategies

## 5. Configuring Codegen
- Package.json setup
- Module registration
- Installation & linking

## 6. Android Implementation
- Module implementation
- Socket communication
- Protocol handling
- Event emission

## 7. iOS Implementation
- Module implementation
- Socket communication
- Protocol handling
- Event emission

## 8. WiFi Connection Management
- Discovering and connecting to the ZAKVOP adapter
- Handling connection states
- Reconnection strategies
- Connection troubleshooting

## 9. OBD-II Protocol Implementation
- Supporting all 7 OBD-II protocols
- AT command handling
- PID request/response processing
- Data parsing and interpretation

## 10. Error Handling Strategies
- Connection errors
- Command errors
- Protocol errors
- Timeout handling

## 11. AI Diagnostic Assistant Implementation
- Architecture overview
- Data collection from OBD-II
- Diagnostic algorithms
- User interface for diagnostic results
- Integration with language models for natural language diagnostics

## 12. Testing the Module
- Unit testing
- Integration testing
- Real-world testing with ZAKVOP scanner
- Performance benchmarking

## 13. Example Application
- Setting up a React Native project
- Integrating the OBD-II module
- Building the AI assistant interface
- Implementing diagnostic workflows

## 14. Deployment Considerations
- Android deployment
- iOS deployment
- Performance optimization
- Battery usage optimization

## 15. Future Enhancements
- Additional sensor support
- Advanced diagnostic capabilities
- Cloud integration possibilities
- Machine learning model improvements

## 16. Troubleshooting Guide
- Common issues and solutions
- Debugging techniques
- Community resources
# OBD-II WiFi Module and AI Vehicle Assistant Guide - Tasks

## Guide Development
- [x] Analyze user requirements
- [x] Create guide structure
- [ ] Write comprehensive guide for OBD WiFi module
  - [ ] Complete introduction section
  - [ ] Complete prerequisites section
  - [ ] Complete core concepts section
  - [ ] Complete module specification section
  - [ ] Complete Codegen configuration section
  - [ ] Complete Android implementation section
  - [ ] Complete iOS implementation section
  - [ ] Complete WiFi connection management section
  - [ ] Complete OBD-II protocol implementation section
  - [ ] Complete error handling strategies section
- [ ] Add AI diagnostic assistant implementation
  - [ ] Architecture overview
  - [ ] Data collection from OBD-II
  - [ ] Diagnostic algorithms
  - [ ] User interface
  - [ ] Integration with language models
- [ ] Include ZAKVOP specific compatibility details
  - [ ] Support for all 7 OBD-II protocols
  - [ ] WiFi connection specifics
  - [ ] Performance optimizations
- [ ] Review and finalize guide
- [ ] Deliver guide to user
# Enhanced Diagnostic Section: Fault Codes Database and Solution Recommendations

This enhanced section expands the diagnostic capabilities of your React Native OBD-II application with a comprehensive fault codes database, solution recommendations, and continuous vehicle monitoring.

## 1. Diagnostic Trouble Codes (DTC) Database

### 1.1 Overview

The DTC database is a comprehensive collection of over 1,300 diagnostic trouble codes extracted from multiple authoritative sources, including:

- Ford's 2007 Powertrain Control/Emissions Diagnosis manual
- Haynes Automotive Diagnostic Fault Codes manual
- Updated 2007 OBD-II codes reference
- RAC diagnostic equipment documentation

Each code entry contains:
- Code identifier (e.g., P0128)
- Title/description
- Detailed explanation
- Possible causes
- Diagnostic aids
- Source reference

### 1.2 Database Structure

The database is organized into categories based on the first digit after the 'P' in the code:

- **P0xxx**: Generic OBD-II codes standardized across all manufacturers
- **P1xxx**: Manufacturer-specific codes
- **P2xxx**: Generic OBD-II codes (includes P0xxx codes)
- **P3xxx**: Generic OBD-II and manufacturer-specific codes

Within these categories, codes are further grouped by system:
- Fuel and Air Metering (P00xx-P02xx)
- Ignition System and Misfire Detection (P03xx)
- Auxiliary Emissions Controls (P04xx)
- Vehicle Speed Control and Idle Control (P05xx)
- Computer Output Circuit (P06xx)
- Transmission (P07xx-P08xx)
- Vehicle Information (P09xx)
- Hybrid Propulsion (P0Axx-P0Fxx)

### 1.3 Implementation in React Native

The DTC database is implemented as a JSON file that can be bundled with your application or loaded from a server. Here's how to integrate it:

```javascript
// src/services/DTCDatabaseService.js
import dtcDatabase from '../assets/dtc_database.json';

class DTCDatabaseService {
  constructor() {
    this.database = dtcDatabase;
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    // You could load from server instead of bundled asset
    // this.database = await fetch('https://your-server.com/api/dtc-database').then(res => res.json());
    this.initialized = true;
    return this;
  }

  async waitForInitialization() {
    if (this.initialized) return Promise.resolve();
    return this.initPromise;
  }

  async getCodeDetails(code) {
    await this.waitForInitialization();
    
    // Normalize code format (uppercase, no spaces)
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');
    
    // Find the code in the database
    const codeDetails = this.database.codes.find(c => c.code === normalizedCode);
    
    return codeDetails || null;
  }

  async searchCodes(query) {
    await this.waitForInitialization();
    
    // Search by code or description
    const normalizedQuery = query.toUpperCase();
    
    return this.database.codes.filter(code => 
      code.code.includes(normalizedQuery) || 
      (code.description && code.description.toUpperCase().includes(normalizedQuery)) ||
      (code.title && code.title.toUpperCase().includes(normalizedQuery))
    );
  }

  async getCodesByCategory(category) {
    await this.waitForInitialization();
    
    if (this.database.categorized && this.database.categorized[category]) {
      return this.database.categorized[category];
    }
    
    return [];
  }
}

export default new DTCDatabaseService();
```

## 2. Solution Recommendation System

### 2.1 Overview

The solution recommendation system provides actionable repair guidance for each diagnostic trouble code. It combines:

- Code-specific information from the DTC database
- System-specific repair procedures
- Severity assessment
- Cost estimation
- Step-by-step diagnostic procedures

This system transforms raw diagnostic codes into practical repair guidance that helps users understand and address vehicle issues.

### 2.2 Solution Components

Each solution recommendation includes:

- **Code Information**: The code identifier, title, and description
- **System Category**: The vehicle system affected (e.g., Fuel and Air Metering)
- **Possible Causes**: Specific components or conditions that may trigger the code
- **Recommended Repairs**: Detailed repair procedures with:
  - Procedure description
  - Tools needed
  - Difficulty level
  - Estimated time
  - Step-by-step instructions
- **Severity**: Assessment of the issue's urgency (High, Medium, Low)
- **Estimated Repair Cost**: Range of potential costs in USD
- **Diagnostic Steps**: Ordered sequence of troubleshooting steps

### 2.3 Implementation in React Native

The solution recommendation system is implemented as a service that works with the DTC database:

```javascript
// src/services/SolutionRecommendationService.js
import solutionDatabase from '../assets/solution_database.json';

class SolutionRecommendationService {
  constructor() {
    this.database = solutionDatabase;
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    // You could load from server instead of bundled asset
    // this.database = await fetch('https://your-server.com/api/solution-database').then(res => res.json());
    this.initialized = true;
    return this;
  }

  async waitForInitialization() {
    if (this.initialized) return Promise.resolve();
    return this.initPromise;
  }

  async getSolutionForCode(code) {
    await this.waitForInitialization();
    
    // Normalize code format
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');
    
    // Find the solution in the database
    if (this.database.solutions && this.database.solutions[normalizedCode]) {
      return this.database.solutions[normalizedCode];
    }
    
    return null;
  }

  async getSeverityColor(severity) {
    switch (severity.toLowerCase()) {
      case 'high':
        return '#FF3B30'; // Red
      case 'medium':
        return '#FF9500'; // Orange
      case 'low':
        return '#34C759'; // Green
      default:
        return '#8E8E93'; // Gray
    }
  }

  async getFormattedCost(costEstimate) {
    if (!costEstimate) return 'Unknown';
    
    return `$${costEstimate.low_estimate} - $${costEstimate.high_estimate}`;
  }
}

export default new SolutionRecommendationService();
```

### 2.4 User Interface Components

Create reusable components to display solution recommendations:

```javascript
// src/components/SolutionRecommendation.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SolutionRecommendationService from '../services/SolutionRecommendationService';

const SolutionRecommendation = ({ solution }) => {
  if (!solution) return null;
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.codeText}>{solution.code}</Text>
        <Text style={styles.titleText}>{solution.title}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{solution.description}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Category</Text>
        <Text style={styles.categoryText}>{solution.system_category}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severity</Text>
        <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(solution.severity) }]}>
          <Text style={styles.severityText}>{solution.severity}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estimated Repair Cost</Text>
        <Text style={styles.costText}>
          ${solution.estimated_repair_cost.low_estimate} - ${solution.estimated_repair_cost.high_estimate}
        </Text>
        <Text style={styles.costNote}>{solution.estimated_repair_cost.note}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Possible Causes</Text>
        {solution.possible_causes.map((cause, index) => (
          <Text key={index} style={styles.causeText}>• {cause}</Text>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Repairs</Text>
        {solution.recommended_repairs.map((repair, index) => (
          <View key={index} style={styles.repairContainer}>
            <Text style={styles.repairTitle}>{repair.procedure}</Text>
            <Text style={styles.repairDescription}>{repair.description}</Text>
            
            <View style={styles.repairDetails}>
              <Text style={styles.detailLabel}>Difficulty:</Text>
              <Text style={styles.detailValue}>{repair.difficulty}</Text>
            </View>
            
            <View style={styles.repairDetails}>
              <Text style={styles.detailLabel}>Est. Time:</Text>
              <Text style={styles.detailValue}>{repair.estimated_time}</Text>
            </View>
            
            <View style={styles.repairDetails}>
              <Text style={styles.detailLabel}>Tools Needed:</Text>
              <Text style={styles.detailValue}>{repair.tools_needed.join(', ')}</Text>
            </View>
            
            <Text style={styles.stepsLabel}>Steps:</Text>
            {repair.steps.map((step, stepIndex) => (
              <Text key={stepIndex} style={styles.stepText}>{stepIndex + 1}. {step}</Text>
            ))}
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnostic Procedure</Text>
        {solution.diagnostic_steps.map((step) => (
          <View key={step.step} style={styles.diagnosticStep}>
            <Text style={styles.stepNumber}>{step.step}</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.description}</Text>
              <Text style={styles.stepDetails}>{step.details}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const getSeverityColor = (severity) => {
  switch (severity.toLowerCase()) {
    case 'high':
      return '#FF3B30'; // Red
    case 'medium':
      return '#FF9500'; // Orange
    case 'low':
      return '#34C759'; // Green
    default:
      return '#8E8E93'; // Gray
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  titleText: {
    fontSize: 16,
    color: '#000000',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  categoryText: {
    fontSize: 14,
    color: '#000000',
  },
  severityIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  costText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  costNote: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  causeText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  repairContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  repairTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  repairDescription: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  repairDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  stepsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 16,
    marginBottom: 4,
  },
  diagnosticStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  stepDetails: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
  },
});

export default SolutionRecommendation;
```

## 3. Vehicle Monitoring System

### 3.1 Overview

The vehicle monitoring system provides continuous tracking of vehicle parameters and health status through the OBD-II connection. It enables:

- Real-time monitoring of critical vehicle parameters
- Trend analysis and anomaly detection
- Early warning of potential issues
- Comprehensive health reporting
- Automatic DTC detection and solution recommendation

This system transforms your application from a simple diagnostic tool into a proactive vehicle health assistant.

### 3.2 Monitoring Parameters

The system monitors parameters across multiple categories:

**Engine Parameters:**
- Engine RPM
- Engine Load
- Coolant Temperature
- Intake Air Temperature
- MAF Air Flow Rate
- Throttle Position

**Vehicle Parameters:**
- Vehicle Speed
- Run Time

**Fuel Parameters:**
- Fuel Pressure
- Fuel Level
- Fuel Rate

**Emissions Parameters:**
- O2 Sensor Voltage
- Catalyst Temperature

Each parameter has defined normal ranges, warning thresholds, and critical thresholds to enable automatic status determination.

### 3.3 Monitoring Profiles

The system supports multiple monitoring profiles to optimize for different use cases:

- **Standard**: Basic vehicle monitoring for everyday driving
- **Performance**: Enhanced monitoring for performance driving
- **Economy**: Monitoring focused on fuel efficiency
- **Diagnostic**: Comprehensive monitoring for diagnosing issues

Each profile specifies which parameters to monitor and at what frequency, allowing users to balance detail with resource usage.

### 3.4 Implementation in React Native

The vehicle monitoring system is implemented as a service that interfaces with the OBD-II module:

```javascript
// src/services/VehicleMonitoringService.js
import { NativeEventEmitter } from 'react-native';
import ObdWiFi from '../ObdWiFi';
import DTCDatabaseService from './DTCDatabaseService';
import SolutionRecommendationService from './SolutionRecommendationService';

// Import monitoring configuration
import { 
  MONITORING_PARAMETERS, 
  MONITORING_PROFILES 
} from '../config/monitoring-config';

class VehicleMonitoringService {
  constructor() {
    this.obd = ObdWiFi;
    this.activeProfile = 'STANDARD';
    this.monitoringActive = false;
    this.currentValues = {};
    this.historicalData = {};
    this.alerts = [];
    this.dtcs = [];
    this.listeners = [];
    this.monitoringInterval = null;
    this.dtcCheckInterval = null;
    
    // Set up event emitter for the native module
    this.eventEmitter = new NativeEventEmitter(ObdWiFi);
    
    // Initialize event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for data events from the OBD module
    this.dataListener = this.eventEmitter.addListener(
      'obdData',
      this.handleObdData.bind(this)
    );
    
    // Listen for DTC events from the OBD module
    this.dtcListener = this.eventEmitter.addListener(
      'obdDtc',
      this.handleObdDtc.bind(this)
    );
    
    // Listen for connection events from the OBD module
    this.connectionListener = this.eventEmitter.addListener(
      'obdConnection',
      this.handleObdConnection.bind(this)
    );
  }
  
  handleObdData(data) {
    // Process incoming OBD data
    if (data && data.pid && data.value) {
      this.updateParameter(data.pid, data.value);
    }
  }
  
  handleObdDtc(data) {
    // Process incoming DTC data
    if (data && data.codes && Array.isArray(data.codes)) {
      this.processDtcs(data.codes);
    }
  }
  
  handleObdConnection(data) {
    // Handle connection status changes
    if (data && data.connected !== undefined) {
      this.notifyListeners('connectionStatus', data);
    }
  }
  
  async startMonitoring(profile = 'STANDARD') {
    if (this.monitoringActive) {
      console.log('Monitoring is already active');
      return false;
    }
    
    // Validate profile
    if (!MONITORING_PROFILES[profile]) {
      console.error(`Invalid monitoring profile: ${profile}`);
      return false;
    }
    
    this.activeProfile = profile;
    this.monitoringActive = true;
    
    // Initialize monitoring data
    this.initializeMonitoringData();
    
    // Start parameter polling
    const pollingInterval = MONITORING_PROFILES[profile].polling_interval * 1000;
    this.monitoringInterval = setInterval(() => {
      this.pollParameters();
    }, pollingInterval);
    
    // Start DTC checking
    this.dtcCheckInterval = setInterval(() => {
      this.checkDtcs();
    }, 30000); // Check DTCs every 30 seconds
    
    // Notify listeners
    this.notifyListeners('monitoringStatus', { active: true, profile });
    
    return true;
  }
  
  async stopMonitoring() {
    if (!this.monitoringActive) {
      console.log('Monitoring is not active');
      return false;
    }
    
    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.dtcCheckInterval) {
      clearInterval(this.dtcCheckInterval);
      this.dtcCheckInterval = null;
    }
    
    this.monitoringActive = false;
    
    // Notify listeners
    this.notifyListeners('monitoringStatus', { active: false });
    
    return true;
  }
  
  initializeMonitoringData() {
    // Initialize current values and historical data
    this.currentValues = {};
    this.historicalData = {};
    this.alerts = [];
    this.dtcs = [];
    
    // Initialize parameters based on profile
    const profileParams = MONITORING_PROFILES[this.activeProfile].parameters;
    
    for (const paramPath of profileParams) {
      const [category, param] = paramPath.split('.');
      const paramInfo = MONITORING_PARAMETERS[category][param];
      
      // Initialize current values
      this.currentValues[paramPath] = {
        value: null,
        unit: paramInfo.unit,
        timestamp: null,
        status: 'unknown'
      };
      
      // Initialize historical data
      this.historicalData[paramPath] = [];
    }
  }
  
  async pollParameters() {
    if (!this.monitoringActive) return;
    
    // Get parameters for the active profile
    const profileParams = MONITORING_PROFILES[this.activeProfile].parameters;
    
    // Group parameters by priority for efficient polling
    const priorityGroups = {
      high: [],
      medium: [],
      low: []
    };
    
    for (const paramPath of profileParams) {
      const [category, param] = paramPath.split('.');
      const paramInfo = MONITORING_PARAMETERS[category][param];
      
      priorityGroups[paramInfo.priority].push({
        path: paramPath,
        pid: paramInfo.pid
      });
    }
    
    // Poll high priority parameters first
    for (const param of priorityGroups.high) {
      await this.pollParameter(param.path, param.pid);
    }
    
    // Then medium priority
    for (const param of priorityGroups.medium) {
      await this.pollParameter(param.path, param.pid);
    }
    
    // Then low priority
    for (const param of priorityGroups.low) {
      await this.pollParameter(param.path, param.pid);
    }
    
    // Generate and notify health status
    const healthStatus = this.generateHealthStatus();
    this.notifyListeners('healthStatus', healthStatus);
  }
  
  async pollParameter(paramPath, pid) {
    try {
      // Request parameter value from OBD module
      const response = await this.obd.sendPidRequest(pid);
      
      if (response && response.value !== undefined) {
        this.updateParameter(paramPath, response.value);
      }
    } catch (error) {
      console.error(`Error polling parameter ${paramPath}: ${error.message}`);
    }
  }
  
  updateParameter(paramPath, value) {
    if (!this.currentValues[paramPath]) return;
    
    const [category, param] = paramPath.split('.');
    const paramInfo = MONITORING_PARAMETERS[category][param];
    
    // Determine parameter status
    const status = this.determineParameterStatus(paramPath, value);
    
    // Update current value
    this.currentValues[paramPath] = {
      value,
      unit: paramInfo.unit,
      timestamp: new Date().toISOString(),
      status
    };
    
    // Add to historical data
    this.historicalData[paramPath].push({
      value,
      timestamp: new Date().toISOString(),
      status
    });
    
    // Limit historical data size
    if (this.historicalData[paramPath].length > 1000) {
      this.historicalData[paramPath] = this.historicalData[paramPath].slice(-1000);
    }
    
    // Check for alerts
    if (status === 'warning' || status === 'critical') {
      this.addAlert(paramPath, value, status);
    }
    
    // Notify listeners
    this.notifyListeners('parameterUpdate', {
      parameter: paramPath,
      value: this.currentValues[paramPath]
    });
  }
  
  determineParameterStatus(paramPath, value) {
    if (value === null || value === undefined) return 'unknown';
    
    const [category, param] = paramPath.split('.');
    const paramInfo = MONITORING_PARAMETERS[category][param];
    
    // Check critical threshold
    if (paramInfo.critical_threshold !== null && paramInfo.critical_threshold !== undefined) {
      if (paramInfo.min_normal !== null && value < paramInfo.min_normal) {
        if (paramInfo.critical_threshold > paramInfo.min_normal && value <= paramInfo.critical_threshold) {
          return 'critical';
        }
      }
      
      if (paramInfo.max_normal !== null && value > paramInfo.max_normal) {
        if (paramInfo.critical_threshold < paramInfo.max_normal && value >= paramInfo.critical_threshold) {
          return 'critical';
        }
      }
    }
    
    // Check warning threshold
    if (paramInfo.warning_threshold !== null && paramInfo.warning_threshold !== undefined) {
      if (paramInfo.min_normal !== null && value < paramInfo.min_normal) {
        if (paramInfo.warning_threshold > paramInfo.min_normal && value <= paramInfo.warning_threshold) {
          return 'warning';
        }
      }
      
      if (paramInfo.max_normal !== null && value > paramInfo.max_normal) {
        if (paramInfo.warning_threshold < paramInfo.max_normal && value >= paramInfo.warning_threshold) {
          return 'warning';
        }
      }
    }
    
    // Check normal range
    if (paramInfo.min_normal !== null && value < paramInfo.min_normal) {
      return 'warning';
    }
    
    if (paramInfo.max_normal !== null && value > paramInfo.max_normal) {
      return 'warning';
    }
    
    return 'normal';
  }
  
  addAlert(paramPath, value, status) {
    const [category, param] = paramPath.split('.');
    const paramInfo = MONITORING_PARAMETERS[category][param];
    
    const alert = {
      id: `${paramPath}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      parameter: paramPath,
      parameterName: paramInfo.name,
      value,
      unit: paramInfo.unit,
      status,
      message: `${paramInfo.name} is ${status}: ${value} ${paramInfo.unit}`
    };
    
    this.alerts.push(alert);
    
    // Limit alerts array size
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    // Notify listeners
    this.notifyListeners('alert', alert);
    
    return alert;
  }
  
  async checkDtcs() {
    if (!this.monitoringActive) return;
    
    try {
      // Request DTCs from OBD module
      const response = await this.obd.readDiagnosticCodes();
      
      if (response && response.codes && Array.isArray(response.codes)) {
        this.processDtcs(response.codes);
      }
    } catch (error) {
      console.error(`Error checking DTCs: ${error.message}`);
    }
  }
  
  async processDtcs(codes) {
    // Process each DTC
    for (const code of codes) {
      // Check if we already have this DTC
      const existingDtc = this.dtcs.find(dtc => dtc.code === code);
      
      if (!existingDtc) {
        // Get DTC details from database
        const dtcDetails = await DTCDatabaseService.getCodeDetails(code);
        
        // Get solution recommendation
        const solution = await SolutionRecommendationService.getSolutionForCode(code);
        
        // Create DTC record
        const dtcRecord = {
          id: `${code}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          code,
          description: dtcDetails ? dtcDetails.description || dtcDetails.title : 'Unknown',
          status: 'active',
          details: dtcDetails,
          solution
        };
        
        // Add to DTCs array
        this.dtcs.push(dtcRecord);
        
        // Notify listeners
        this.notifyListeners('dtc', dtcRecord);
      }
    }
  }
  
  getParameterTrend(paramPath, timeRange = 3600) {
    if (!this.historicalData[paramPath]) return null;
    
    // Filter data by time range
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRange * 1000);
    
    const filteredData = this.historicalData[paramPath].filter(item => 
      new Date(item.timestamp) >= startTime
    );
    
    if (filteredData.length < 2) return null;
    
    // Calculate statistics
    const values = filteredData.map(item => item.value);
    const timestamps = filteredData.map(item => new Date(item.timestamp));
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate trend (simple linear regression)
    const seconds = timestamps.map(ts => (ts - timestamps[0]) / 1000);
    
    const n = values.length;
    const sumX = seconds.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = seconds.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = seconds.reduce((sum, val) => sum + val * val, 0);
    
    // Avoid division by zero
    let slope = 0;
    if (n * sumXX - sumX * sumX !== 0) {
      slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    // Determine trend direction
    let trend = 'stable';
    if (slope > 0.001) {
      trend = 'increasing';
    } else if (slope < -0.001) {
      trend = 'decreasing';
    }
    
    // Get parameter info
    const [category, param] = paramPath.split('.');
    const paramInfo = MONITORING_PARAMETERS[category][param];
    
    return {
      parameter: paramPath,
      name: paramInfo.name,
      unit: paramInfo.unit,
      timeRange,
      dataPoints: filteredData.length,
      minValue,
      maxValue,
      avgValue: parseFloat(avgValue.toFixed(2)),
      currentValue: this.currentValues[paramPath].value,
      trend,
      slope: parseFloat(slope.toFixed(6)),
      status: this.currentValues[paramPath].status
    };
  }
  
  generateHealthStatus() {
    // Count parameters by status
    const statusCounts = { normal: 0, warning: 0, critical: 0, unknown: 0 };
    
    for (const paramPath in this.currentValues) {
      const status = this.currentValues[paramPath].status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
    
    // Determine overall health status
    let overallStatus = 'normal';
    if (statusCounts.critical > 0) {
      overallStatus = 'critical';
    } else if (statusCounts.warning > 0) {
      overallStatus = 'warning';
    } else if (statusCounts.unknown > 0 && statusCounts.normal === 0) {
      overallStatus = 'unknown';
    }
    
    // Get parameter trends
    const parameterTrends = {};
    for (const paramPath in this.currentValues) {
      const trend = this.getParameterTrend(paramPath);
      if (trend) {
        parameterTrends[paramPath] = trend;
      }
    }
    
    // Create health status report
    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      parameterStatus: statusCounts,
      parameterTrends,
      recentAlerts: this.alerts.slice(-5),
      activeDtcs: this.dtcs.filter(dtc => dtc.status === 'active')
    };
  }
  
  addListener(event, callback) {
    if (typeof callback !== 'function') return null;
    
    const listener = { event, callback };
    this.listeners.push(listener);
    
    return {
      remove: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }
  
  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event || listener.event === '*')
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in listener callback: ${error.message}`);
        }
      });
  }
  
  cleanup() {
    // Stop monitoring
    this.stopMonitoring();
    
    // Remove event listeners
    if (this.dataListener) {
      this.dataListener.remove();
    }
    
    if (this.dtcListener) {
      this.dtcListener.remove();
    }
    
    if (this.connectionListener) {
      this.connectionListener.remove();
    }
    
    // Clear all listeners
    this.listeners = [];
  }
}

export default new VehicleMonitoringService();
```

### 3.5 User Interface Components

Create reusable components to display vehicle monitoring data:

```javascript
// src/components/VehicleHealthDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import VehicleMonitoringService from '../services/VehicleMonitoringService';

const VehicleHealthDashboard = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterTrend, setParameterTrend] = useState(null);
  
  useEffect(() => {
    // Subscribe to health status updates
    const healthListener = VehicleMonitoringService.addListener(
      'healthStatus',
      handleHealthStatus
    );
    
    // Get initial health status
    const initialStatus = VehicleMonitoringService.generateHealthStatus();
    if (initialStatus) {
      handleHealthStatus(initialStatus);
    }
    
    return () => {
      // Clean up listener
      if (healthListener) {
        healthListener.remove();
      }
    };
  }, []);
  
  const handleHealthStatus = (status) => {
    setHealthStatus(status);
    
    // If no parameter is selected, select the first one
    if (!selectedParameter && status && status.parameterTrends) {
      const firstParam = Object.keys(status.parameterTrends)[0];
      if (firstParam) {
        setSelectedParameter(firstParam);
        setParameterTrend(status.parameterTrends[firstParam]);
      }
    } else if (selectedParameter && status && status.parameterTrends) {
      // Update selected parameter trend
      setParameterTrend(status.parameterTrends[selectedParameter]);
    }
  };
  
  const handleParameterSelect = (paramPath) => {
    setSelectedParameter(paramPath);
    if (healthStatus && healthStatus.parameterTrends) {
      setParameterTrend(healthStatus.parameterTrends[paramPath]);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return '#FF3B30'; // Red
      case 'warning':
        return '#FF9500'; // Orange
      case 'normal':
        return '#34C759'; // Green
      default:
        return '#8E8E93'; // Gray
    }
  };
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return '↑';
      case 'decreasing':
        return '↓';
      default:
        return '→';
    }
  };
  
  if (!healthStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading vehicle health data...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Health Dashboard</Text>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(healthStatus.overallStatus) }]}>
          <Text style={styles.statusText}>{healthStatus.overallStatus.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.statusSummary}>
        <View style={styles.statusItem}>
          <Text style={styles.statusCount}>{healthStatus.parameterStatus.normal}</Text>
          <Text style={styles.statusLabel}>Normal</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusCount}>{healthStatus.parameterStatus.warning}</Text>
          <Text style={styles.statusLabel}>Warning</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusCount}>{healthStatus.parameterStatus.critical}</Text>
          <Text style={styles.statusLabel}>Critical</Text>
        </View>
      </View>
      
      {healthStatus.activeDtcs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Diagnostic Codes</Text>
          {healthStatus.activeDtcs.map((dtc) => (
            <View key={dtc.id} style={styles.dtcItem}>
              <Text style={styles.dtcCode}>{dtc.code}</Text>
              <Text style={styles.dtcDescription}>{dtc.description}</Text>
            </View>
          ))}
        </View>
      )}
      
      {healthStatus.recentAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          {healthStatus.recentAlerts.map((alert) => (
            <View key={alert.id} style={[styles.alertItem, { borderLeftColor: getStatusColor(alert.status) }]}>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parameter Trends</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parameterList}>
          {Object.entries(healthStatus.parameterTrends).map(([paramPath, trend]) => (
            <TouchableOpacity
              key={paramPath}
              style={[
                styles.parameterItem,
                selectedParameter === paramPath && styles.selectedParameter,
                { borderLeftColor: getStatusColor(trend.status) }
              ]}
              onPress={() => handleParameterSelect(paramPath)}
            >
              <Text style={styles.parameterName}>{trend.name}</Text>
              <Text style={styles.parameterValue}>
                {trend.currentValue} {trend.unit} {getTrendIcon(trend.trend)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {parameterTrend && (
          <View style={styles.trendDetail}>
            <Text style={styles.trendTitle}>
              {parameterTrend.name} Trend ({parameterTrend.timeRange / 60} min)
            </Text>
            
            <View style={styles.trendStats}>
              <View style={styles.trendStat}>
                <Text style={styles.trendStatLabel}>Min</Text>
                <Text style={styles.trendStatValue}>
                  {parameterTrend.minValue} {parameterTrend.unit}
                </Text>
              </View>
              <View style={styles.trendStat}>
                <Text style={styles.trendStatLabel}>Avg</Text>
                <Text style={styles.trendStatValue}>
                  {parameterTrend.avgValue} {parameterTrend.unit}
                </Text>
              </View>
              <View style={styles.trendStat}>
                <Text style={styles.trendStatLabel}>Max</Text>
                <Text style={styles.trendStatValue}>
                  {parameterTrend.maxValue} {parameterTrend.unit}
                </Text>
              </View>
              <View style={styles.trendStat}>
                <Text style={styles.trendStatLabel}>Trend</Text>
                <Text style={styles.trendStatValue}>
                  {parameterTrend.trend} {getTrendIcon(parameterTrend.trend)}
                </Text>
              </View>
            </View>
            
            {/* This is a simplified chart. In a real app, you would use historical data */}
            <LineChart
              data={{
                labels: ['1h ago', '45m', '30m', '15m', 'now'],
                datasets: [
                  {
                    data: [
                      parameterTrend.avgValue * 0.9,
                      parameterTrend.avgValue * 0.95,
                      parameterTrend.avgValue,
                      parameterTrend.avgValue * 1.05,
                      parameterTrend.currentValue
                    ]
                  }
                ]
              }}
              width={350}
              height={180}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              style={styles.chart}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    borderRadius: 10,
    marginHorizontal: 16,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  statusLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    borderRadius: 10,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  dtcItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dtcCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dtcDescription: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
  },
  alertItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    borderLeftWidth: 4,
    paddingLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#000000',
  },
  alertTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  parameterList: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  parameterItem: {
    padding: 12,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderLeftWidth: 4,
    minWidth: 120,
  },
  selectedParameter: {
    backgroundColor: '#E5E5EA',
  },
  parameterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  parameterValue: {
    fontSize: 14,
    color: '#000000',
    marginTop: 4,
  },
  trendDetail: {
    marginTop: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  trendStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  trendStat: {
    flex: 1,
    alignItems: 'center',
  },
  trendStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  trendStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default VehicleHealthDashboard;
```

## 4. Integration with React Native OBD-II Module

### 4.1 Connecting the Components

To integrate these enhanced diagnostic capabilities with your React Native OBD-II module, you'll need to:

1. **Initialize the services** when your application starts:

```javascript
// src/App.js
import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ConnectionScreen from './screens/ConnectionScreen';
import DiagnosticScreen from './screens/DiagnosticScreen';
import MonitoringScreen from './screens/MonitoringScreen';
import DTCDetailsScreen from './screens/DTCDetailsScreen';

// Import services
import ObdWiFi from './ObdWiFi';
import DTCDatabaseService from './services/DTCDatabaseService';
import SolutionRecommendationService from './services/SolutionRecommendationService';
import VehicleMonitoringService from './services/VehicleMonitoringService';

const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    // Initialize services
    DTCDatabaseService.initialize();
    SolutionRecommendationService.initialize();
    
    // Clean up on unmount
    return () => {
      VehicleMonitoringService.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'OBD-II Assistant' }} />
          <Stack.Screen name="Connection" component={ConnectionScreen} options={{ title: 'Connect to Vehicle' }} />
          <Stack.Screen name="Diagnostic" component={DiagnosticScreen} options={{ title: 'Diagnostics' }} />
          <Stack.Screen name="Monitoring" component={MonitoringScreen} options={{ title: 'Vehicle Monitoring' }} />
          <Stack.Screen name="DTCDetails" component={DTCDetailsScreen} options={{ title: 'Trouble Code Details' }} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default App;
```

2. **Create a diagnostic screen** that uses the DTC database and solution recommendation system:

```javascript
// src/screens/DiagnosticScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import ObdWiFi from '../ObdWiFi';
import DTCDatabaseService from '../services/DTCDatabaseService';

const DiagnosticScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [dtcs, setDtcs] = useState([]);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    try {
      const connected = await ObdWiFi.isConnected();
      
      if (!connected) {
        navigation.replace('Connection');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking connection:', error);
      navigation.replace('Connection');
    }
  };
  
  const scanForDtcs = async () => {
    setScanning(true);
    
    try {
      // Read DTCs from vehicle
      const result = await ObdWiFi.readDiagnosticCodes();
      
      if (result && result.codes) {
        // Process each DTC
        const dtcPromises = result.codes.map(async (code) => {
          // Get details from database
          const details = await DTCDatabaseService.getCodeDetails(code);
          
          return {
            code,
            description: details ? details.description || details.title : 'Unknown',
            details
          };
        });
        
        // Wait for all DTCs to be processed
        const processedDtcs = await Promise.all(dtcPromises);
        setDtcs(processedDtcs);
      } else {
        setDtcs([]);
      }
    } catch (error) {
      console.error('Error scanning for DTCs:', error);
    } finally {
      setScanning(false);
    }
  };
  
  const clearDtcs = async () => {
    setScanning(true);
    
    try {
      // Clear DTCs
      await ObdWiFi.clearDiagnosticCodes();
      
      // Scan again to verify
      await scanForDtcs();
    } catch (error) {
      console.error('Error clearing DTCs:', error);
    } finally {
      setScanning(false);
    }
  };
  
  const renderDtcItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dtcItem}
      onPress={() => navigation.navigate('DTCDetails', { code: item.code })}
    >
      <Text style={styles.dtcCode}>{item.code}</Text>
      <Text style={styles.dtcDescription}>{item.description}</Text>
      <Text style={styles.viewDetails}>View Details ›</Text>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, scanning && styles.disabledButton]}
          onPress={scanForDtcs}
          disabled={scanning}
        >
          <Text style={styles.buttonText}>Scan for Trouble Codes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton, scanning && styles.disabledButton]}
          onPress={clearDtcs}
          disabled={scanning}
        >
          <Text style={styles.buttonText}>Clear Trouble Codes</Text>
        </TouchableOpacity>
      </View>
      
      {scanning ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Scanning for trouble codes...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            {dtcs.length > 0
              ? `Found ${dtcs.length} Trouble Code${dtcs.length !== 1 ? 's' : ''}`
              : 'No Trouble Codes Found'}
          </Text>
          
          <FlatList
            data={dtcs}
            renderItem={renderDtcItem}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Your vehicle is not reporting any trouble codes.
              </Text>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    flexGrow: 1,
  },
  dtcItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  dtcCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dtcDescription: {
    fontSize: 14,
    color: '#000000',
    marginTop: 4,
    marginBottom: 8,
  },
  viewDetails: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default DiagnosticScreen;
```

3. **Create a DTC details screen** that shows solution recommendations:

```javascript
// src/screens/DTCDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import DTCDatabaseService from '../services/DTCDatabaseService';
import SolutionRecommendationService from '../services/SolutionRecommendationService';
import SolutionRecommendation from '../components/SolutionRecommendation';

const DTCDetailsScreen = ({ route }) => {
  const { code } = route.params;
  const [loading, setLoading] = useState(true);
  const [solution, setSolution] = useState(null);
  
  useEffect(() => {
    loadSolution();
  }, []);
  
  const loadSolution = async () => {
    try {
      // Get solution recommendation
      const solutionData = await SolutionRecommendationService.getSolutionForCode(code);
      setSolution(solutionData);
    } catch (error) {
      console.error('Error loading solution:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return <SolutionRecommendation solution={solution} />;
};

export default DTCDetailsScreen;
```

4. **Create a monitoring screen** that uses the vehicle monitoring system:

```javascript
// src/screens/MonitoringScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import ObdWiFi from '../ObdWiFi';
import VehicleMonitoringService from '../services/VehicleMonitoringService';
import VehicleHealthDashboard from '../components/VehicleHealthDashboard';

const MonitoringScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [profile, setProfile] = useState('STANDARD');
  
  useEffect(() => {
    checkConnection();
    
    // Set up monitoring status listener
    const monitoringListener = VehicleMonitoringService.addListener(
      'monitoringStatus',
      handleMonitoringStatus
    );
    
    return () => {
      // Stop monitoring when screen is unmounted
      VehicleMonitoringService.stopMonitoring();
      
      // Clean up listener
      if (monitoringListener) {
        monitoringListener.remove();
      }
    };
  }, []);
  
  const checkConnection = async () => {
    try {
      const connected = await ObdWiFi.isConnected();
      
      if (!connected) {
        navigation.replace('Connection');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking connection:', error);
      navigation.replace('Connection');
    }
  };
  
  const handleMonitoringStatus = (status) => {
    setMonitoring(status.active);
    if (status.active && status.profile) {
      setProfile(status.profile);
    }
  };
  
  const startMonitoring = async (selectedProfile) => {
    try {
      await VehicleMonitoringService.startMonitoring(selectedProfile);
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };
  
  const stopMonitoring = async () => {
    try {
      await VehicleMonitoringService.stopMonitoring();
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {!monitoring ? (
        <View style={styles.profileSelection}>
          <Text style={styles.sectionTitle}>Select Monitoring Profile</Text>
          
          <TouchableOpacity
            style={[styles.profileItem, profile === 'STANDARD' && styles.selectedProfile]}
            onPress={() => setProfile('STANDARD')}
          >
            <Text style={styles.profileName}>Standard Monitoring</Text>
            <Text style={styles.profileDescription}>
              Basic vehicle monitoring for everyday driving
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.profileItem, profile === 'PERFORMANCE' && styles.selectedProfile]}
            onPress={() => setProfile('PERFORMANCE')}
          >
            <Text style={styles.profileName}>Performance Monitoring</Text>
            <Text style={styles.profileDescription}>
              Enhanced monitoring for performance driving
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.profileItem, profile === 'ECONOMY' && styles.selectedProfile]}
            onPress={() => setProfile('ECONOMY')}
          >
            <Text style={styles.profileName}>Economy Monitoring</Text>
            <Text style={styles.profileDescription}>
              Monitoring focused on fuel efficiency
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.profileItem, profile === 'DIAGNOSTIC' && styles.selectedProfile]}
            onPress={() => setProfile('DIAGNOSTIC')}
          >
            <Text style={styles.profileName}>Diagnostic Monitoring</Text>
            <Text style={styles.profileDescription}>
              Comprehensive monitoring for diagnosing issues
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => startMonitoring(profile)}
          >
            <Text style={styles.startButtonText}>Start Monitoring</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.monitoringContainer}>
          <View style={styles.monitoringHeader}>
            <Text style={styles.monitoringTitle}>
              {VehicleMonitoringService.activeProfile === 'STANDARD' && 'Standard Monitoring'}
              {VehicleMonitoringService.activeProfile === 'PERFORMANCE' && 'Performance Monitoring'}
              {VehicleMonitoringService.activeProfile === 'ECONOMY' && 'Economy Monitoring'}
              {VehicleMonitoringService.activeProfile === 'DIAGNOSTIC' && 'Diagnostic Monitoring'}
            </Text>
            
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopMonitoring}
            >
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
          
          <VehicleHealthDashboard />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  profileSelection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedProfile: {
    backgroundColor: '#E5F2FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  profileDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  monitoringContainer: {
    flex: 1,
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  monitoringTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MonitoringScreen;
```

## 5. Conclusion

This enhanced diagnostic section transforms your React Native OBD-II application into a comprehensive vehicle diagnostic and monitoring system. By integrating the fault codes database, solution recommendation system, and continuous vehicle monitoring capabilities, your application can now:

1. **Identify Issues**: Detect and decode diagnostic trouble codes from the vehicle's ECU
2. **Provide Solutions**: Offer detailed repair recommendations with step-by-step procedures
3. **Monitor Health**: Continuously track vehicle parameters and detect anomalies
4. **Predict Problems**: Analyze trends to identify potential issues before they become serious

These enhancements directly address the need for a complete AI vehicle assistant that can connect to your ZAKVOP OBD2 scanner, help diagnose issues, and provide ongoing monitoring of your vehicle.

The implementation leverages the resources provided in the diagnostic fault codes manuals and combines them with modern React Native development practices to create a powerful, user-friendly diagnostic tool.

By following this guide, you'll be able to create an application that not only reads trouble codes but also helps users understand and resolve vehicle issues, potentially saving them time and money on unnecessary repairs.
