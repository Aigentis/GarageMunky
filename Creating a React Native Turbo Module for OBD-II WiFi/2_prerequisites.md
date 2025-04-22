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
