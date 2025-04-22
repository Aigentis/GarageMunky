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


(Content truncated due to size limit. Use line ranges to read in chunks)