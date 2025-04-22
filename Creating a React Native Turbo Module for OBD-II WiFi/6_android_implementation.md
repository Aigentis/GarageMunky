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
                val resultArray = Arguments.createAr
(Content truncated due to size limit. Use line ranges to read in chunks)