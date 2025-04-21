# GarageMunky Project Requirements Document

## 1. Project Overview

GarageMunky is a mobile application built to modernize vehicle management for car owners and garage operators across the UK. The app connects car owners with local garages by leveraging an AI-powered platform that delivers real-time vehicle data, smart appointment scheduling, and interactive communication tools. By using trusted government APIs for accurate vehicle details, integrating secure payment processing with Stripe, and incorporating AI features like a predictive booking assistant and a GPT-powered diagnostic tool, GarageMunky solves the everyday problems of keeping track of MOT statuses, tax deadlines, and maintenance needs in a streamlined, efficient way.

The app is being built to address the common hassles associated with car upkeep. With clearly defined roles for both car owners and garage operators, the system provides each group with tailored dashboards and functionalities. Key objectives for GarageMunky include reducing the time and complexity of scheduling repairs and maintenance, delivering reliable vehicle information, and ensuring secure transactions through built-in payment and compliance measures. The success of the project will be measured by user uptake, satisfaction, and the reliability of the real-time integrations that form the backbone of the service.

## 2. In-Scope vs. Out-of-Scope

**In-Scope:**

*   Implementation of a mobile application using React Native (TypeScript), featuring a clean and modern UI with Tailwind CSS and Shadcn UI.
*   Integration with UK GOV APIs to fetch and display real-time vehicle data such as MOT status, tax details, registration number, and more.
*   Secure user authentication through OAuth methods (Google, Apple, or email) with role selection between car owners and garage operators.
*   Development of an AI-powered predictive booking assistant that provides scheduling recommendations based on user inputs and historical data.
*   Integration of a GPT-powered diagnostic tool that interacts with users to diagnose vehicle issues through natural language processing.
*   Seamless integration with Stripe for secure, PCI DSS compliant payment processing.
*   Integration with Google Maps for garage location services.
*   Implementation of multi-channel messaging support via WhatsApp and SMS (with Twilio as a fallback) for appointment notifications and alerts.
*   Creation of distinct dashboards for car owners, garage operators, and administrators (the admin dashboard built on Appwrite for monitoring system performance and user activities).

**Out-of-Scope:**

*   Expansion of the platform to non-UK markets or international vehicle data sources in the initial release.
*   Comprehensive premium messaging services; while basic multi-channel messaging is included, advanced features are reserved for future versions.
*   Support for multiple languages in the initial launch; additional language support is planned for later phases.
*   Extended integrations beyond the core UK GOV APIs, Stripe, Google Maps, WhatsApp, and Twilio for notification and payment processing.
*   Implementation of detailed back-office management features beyond basic monitoring and analytics in the admin dashboard.

## 3. User Flow

A new user, whether a car owner or a garage operator, will first encounter a streamlined sign-up and login screen that prominently features OAuth options like Google, Apple, or email authentication. During registration, users select their account type, which tailors the subsequent experience. Car owners are greeted with a personalized dashboard that displays vital vehicle data such as MOT status, tax expiry dates, vehicle make and model, and registration number. The dashboard also provides direct access to the AI-powered predictive booking assistant, where users can input service needs, select preferred dates and times, and receive AI recommendations based on their upcoming maintenance and local garage availability.

Once a booking recommendation is accepted, the app transitions the user into a secure scheduling process that confirms the selected slot in real-time through API calls to the relevant garage services. The payment step is seamlessly integrated using Stripe, ensuring that the financial transaction is both secure and swift. Post-booking, users can manage their notifications and communication preferences through the messaging center, where they can receive appointment reminders, confirmations, and other service-related alerts via WhatsApp or SMS. Garage operators, on the other hand, see a dashboard focused on calendar management, customer bookings, and enhanced messaging features that assist in operational oversight and direct communication with clients.

## 4. Core Features (Bullet Points)

*   **User Authentication & Role Differentiation:**\
    • OAuth sign-up/login (Google, Apple, or email).\
    • Role selection between car owners and garage operators.
*   **Vehicle Data Integration:**\
    • Real-time data fetching from UK GOV APIs.\
    • Display of MOT status, tax expiry dates, registration number, vehicle make/model, mileage, emissions data, and last MOT test summary.
*   **AI-Powered Appointment Scheduling:**\
    • Predictive booking assistant providing optimal service slot recommendations based on vehicle maintenance history and user preferences.\
    • Real-time appointment slot validation via API calls to local garages.
*   **GPT-Powered Diagnostic Tool:**\
    • Conversation-style interface to help diagnose vehicle issues based on user-described symptoms.\
    • Step-by-step troubleshooting tips and next-step recommendations for service needs.
*   **Secure Payment Processing:**\
    • Integrated Stripe interface ensuring secure payments in compliance with PCI DSS.
*   **Mapping & Location Services:**\
    • Google Maps integration to locate nearby garages and view their service availability.
*   **Messaging & Notifications:**\
    • Multi-channel messaging via WhatsApp and SMS with Twilio as backup.\
    • Configurable notifications for appointment reminders, booking confirmations, service alerts, and vehicle recall notices.
*   **Admin Dashboard:**\
    • Back-office management tool to monitor app performance, track user engagement, manage error tracking, and oversee system status using Appwrite as the backend management solution.

## 5. Tech Stack & Tools

*   **Frontend:**\
    • React Native with TypeScript for building the mobile application.\
    • Tailwind CSS and Shadcn UI for modern, responsive, and clean styling.
*   **Backend & Services:**\
    • Appwrite for authentication, database management, and the admin dashboard backend.\
    • UK GOV APIs for fetching reliable vehicle data.\
    • OpenAI GPT-4 Turbo for powering the diagnostic tool and contributing to the predictive booking assistant.
*   **Payment & Mapping:**\
    • Stripe for secure payment processing and PCI DSS compliance.\
    • Google Maps for garage location and navigation.
*   **Messaging & Notifications:**\
    • WhatsApp for primary messaging.\
    • Twilio for SMS as a backup and supplementary communication channel.
*   **Development Tools:**\
    • Lovable used as an initial coding assistant for rapid prototyping and front-end/full-stack setup.\
    • Windsurf as the modern IDE for finalizing and streamlining the coding process.

## 6. Non-Functional Requirements

*   **Performance:**\
    • Optimized load times, targeting under 3 seconds for a smooth mobile experience.\
    • Efficient API calls to ensure real-time data synchronization and responsiveness.
*   **Security & Compliance:**\
    • GDPR and UK Data Protection Act 2018 compliance for personal and vehicle data.\
    • Adherence to PCI DSS standards for handling payment transactions securely.
*   **Scalability:**\
    • A robust and modular architecture that accommodates future enhancements such as premium messaging services and internationalization.
*   **Usability:**\
    • Intuitive navigation with a focus on accessibility and clear presentation of vehicle maintenance information.\
    • Consistent user interface elements that follow the UK transport-inspired color palette and branding guidelines.

## 7. Constraints & Assumptions

*   **Dependencies:**\
    • Reliable availability of UK GOV APIs for accurate vehicle data.\
    • Ongoing access to OpenAI’s GPT-4 Turbo model for AI-driven features.\
    • Continued compliance and integration with Stripe’s payment processing platform.
*   **Assumptions:**\
    • Users will have a basic understanding of mobile app navigation and digital vehicle management.\
    • The chosen tech stack (React Native, Appwrite, etc.) can seamlessly integrate and scale based on user growth.\
    • Future expansions, like premium messaging and additional language support, are anticipated and factored into the initial architecture design.
*   **Color & Branding Assets:**\
    • The specific UK transport-inspired color palette and other styling guidelines will be provided through uploaded screenshots.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits & Data Inconsistency:**\
    • Potential issues with UK GOV APIs if rate limits are exceeded or if data is delayed, which could affect the real-time vehicle status display. • Mitigation: Implement caching mechanisms and error handling routines to manage API downtime.
*   **AI Interaction Nuances:**\
    • Ensuring the GPT-powered diagnostic tool provides accurate and contextually relevant advice without causing user confusion. • Mitigation: Incorporate iterative user testing and include fallback prompts that encourage professional consultation when needed.
*   **Payment Processing Challenges:**\
    • Handling edge cases in the payment process, such as transaction failures or network issues during Stripe integration. • Mitigation: Ensure robust error handling, clear user messaging, and the ability to retry payment processes seamlessly.
*   **Messaging & Notification Failures:**\
    • Potential issues with message delivery through WhatsApp or SMS, impacting timely communication. • Mitigation: Monitor message delivery success rates and provide users with options to update their communication preferences or retry delivery.
*   **Role-Specific UI/UX Clarity:**\
    • The risk of confusing users if role-specific features are not clearly delineated between car owners and garage operators. • Mitigation: Use distinct navigation structures and clear labeling within the UI to differentiate user experiences from the point of registration.

This document now serves as the comprehensive and unambiguous blueprint for GarageMunky, ensuring that all subsequent technical documents—from frontend guidelines to backend structure—can be developed without guesswork.
