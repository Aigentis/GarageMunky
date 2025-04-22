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
(Content truncated due to size limit. Use line ranges to read in chunks)