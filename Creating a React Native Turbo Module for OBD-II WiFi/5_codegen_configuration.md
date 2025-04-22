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
