# .windsurfrules

## Project Overview

*   **Type:** windsurf_file
*   **Description:** GarageMunky is a mobile application designed to modernize vehicle management for car owners and garage operators in the UK. By leveraging an AI-powered platform, GarageMunky connects users with local garages, providing features such as MOT and tax tracking, appointment bookings, communication tools, and a GPT-powered diagnostic assistant. The app integrates secure payment handling with Stripe, real-time UK GOV API vehicle data, and multi-channel messaging via WhatsApp/SMS. The mission is to enhance the car care experience via automation and intelligent solutions.
*   **Primary Goal:** Modernize vehicle management by offering real-time vehicle data, AI-powered predictive booking, GPT-based diagnostics, and secure payment integration to streamline the maintenance experience for both car owners and garage operators.

## Project Structure

### Framework-Specific Routing

*   **Directory Rules:**

    *   React Native (using latest stable release): Uses react-navigation to handle screen routing. Routes are defined in the `src/navigation` directory with a stack navigator managing transitions between onboarding, dashboards, appointment booking, and payment screens.
    *   Example: The onboarding flow is handled through `src/navigation/AuthNavigator.tsx` and the main app flow through `src/navigation/AppNavigator.tsx`.

### Core Directories

*   **Versioned Structure:**

    *   `src/screens`: Contains role-specific screens (e.g., Car Owner Dashboard, Garage Operator Dashboard, Appointment Booking, Diagnostic Tool) built with React Native components.
    *   `src/components`: Reusable UI components styled with Tailwind CSS and Shadcn UI guidelines.
    *   `src/services`: Modules for API integrations (UK GOV APIs, Stripe, and messaging services via WhatsApp/Twilio) and AI interactions (OpenAI GPT-4 Turbo based predictive and diagnostic tools).

### Key Files

*   **Stack-Versioned Patterns:**

    *   `src/navigation/AppNavigator.tsx`: Implements the main navigation flow using react-navigation, organizing the screen routes for authenticated users.
    *   `src/screens/Dashboard.tsx`: Serves as the primary landing page post-sign-in, displaying critical vehicle data and access to AI tools.
    *   `src/screens/Auth.tsx`: Manages the sign-up/sign-in flows with OAuth integration.

## Tech Stack Rules

*   **Version Enforcement:**

    *   react-native@[latest]: Follow best practices for mobile navigation using react-navigation. Ensure all UI components are compatible with the latest stable version and adhere to TypeScript strict typing.
    *   TailwindCSS & Shadcn UI: Enforce responsive design guidelines for mobile across all screens.
    *   Appwrite: Use for authentication, database, and admin dashboard functionalities with version-specific API integrations.

## PRD Compliance

*   **Non-Negotiable:**

    *   "GarageMunky is a mobile application built to modernize vehicle management for car owners and garage operators across the UK. The app integrates AI-powered predictive booking, real-time vehicle data from UK GOV APIs, a GPT-powered diagnostic tool, secure payment processing with Stripe, and robust messaging via WhatsApp/SMS." This mandate necessitates strict compliance with GDPR, the UK Data Protection Act 2018, and PCI DSS for secure payment handling.

## App Flow Integration

*   **Stack-Aligned Flow:**

    *   Example: "React Native Auth Flow → `src/navigation/AuthNavigator.tsx` initiates OAuth-based login, followed by a transition to `src/screens/Dashboard.tsx` where real-time vehicle data is presented, and then to `src/screens/Booking.tsx` where the AI-powered predictive booking assistant recommends optimal service slots, ultimately integrating a secure Stripe payment interface."
