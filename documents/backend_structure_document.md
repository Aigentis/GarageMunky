# GarageMunky - Backend Structure Document

This document explains the GarageMunky backend setup using everyday language. It covers everything from the architecture to security measures. The aim is to clearly describe how our backend works to support a fast, secure, and scalable mobile application for modern vehicle management.

## 1. Backend Architecture

The backend of GarageMunky is designed with scalability, maintainability, and performance in mind. Key points include:

*   **Modular Design:** The system is broken down into separate components, letting us update or expand one area without affecting others.

*   **Service-Oriented Approach:** We use a service architecture where each feature (like authentication, payments, messaging) has its own dedicated service.

*   **Frameworks & Tools:**

    *   Appwrite provides authentication, database, and admin dashboard capabilities.
    *   Integration with external APIs (UK GOV APIs, OpenAI GPT-4 Turbo, Stripe, Google Maps, WhatsApp, and Twilio) is done through clear, well-documented endpoints.

*   **Scalability:** The modular setup and choice of cloud hosting helps us add resources as needed. Each service can be scaled independently based on demand.

*   **Maintainability:** With clear separation of concerns, any updates or fixes in one module won't disrupt others, keeping the app running smoothly.

*   **Performance:** Optimized endpoints along with caching techniques (especially useful during high API rate limit periods) keep response times low.

## 2. Database Management

Data is stored and managed using Appwrite's embedded database, which offers both flexibility and security. Here’s how we handle it:

*   **Database Type:** Primarily a NoSQL database that organizes data into collections and documents, which is ideal for our variable data models.

*   **Data Structure:**

    *   Each user (car owner, garage operator, administrator) has their own profile document.
    *   Vehicle information is stored with details such as MOT status, tax expiry, and insurance data.
    *   Booking and appointment records are maintained in a separate collection.
    *   Payment details and transaction history via Stripe are securely kept.

*   **Data Access:**

    *   Appwrite’s built-in features handle data access and permissions, ensuring that users see only what they’re allowed to.
    *   Caching is implemented on commonly accessed data, such as vehicle histories from UK GOV APIs, to reduce API rate limit issues.

## 3. Database Schema

For human readability, here’s what a simplified version of our database schema might look like:

*   **Users Collection:**

    *   Fields: User ID, Full Name, Email, Role (Car Owner, Garage Operator, Administrator), OAuth Provider (Google, Apple, Email), and preferences.

*   **Vehicles Collection:**

    *   Fields: Vehicle ID, Registration Number, Make & Model, MOT Status/Expiry, Tax Status/Expiry, Insurance Information, Emissions Data, Mileage Record.

*   **Appointments Collection:**

    *   Fields: Appointment ID, User ID, Garage ID, Scheduled Time, Booking Status, Payment Confirmation, AI Recommendation Details.

*   **Transactions Collection:**

    *   Fields: Transaction ID, User ID, Payment Amount, Payment Status, Stripe Transaction Reference.

*   **Messages Collection:**

    *   Fields: Message ID, Sender, Receiver, Content, Timestamp, Message Type (WhatsApp, SMS).

(While our primary storage is NoSQL through Appwrite, if we had an SQL scenario, it might feature relational tables for users, vehicles, appointments, transactions, and messages.)

## 4. API Design and Endpoints

The APIs connect the frontend of GarageMunky with our backend services. We focus on clear, RESTful designs with endpoints like:

*   **Authentication Endpoints:**

    *   Login, logout, and registration endpoints supporting OAuth through Google, Apple, or email.
    *   Role selection during registration to determine user access levels.

*   **Vehicle Data Endpoints:**

    *   Fetch real-time vehicle data from the UK GOV API.
    *   Endpoint returns details such as MOT and tax expiry dates, registration number, and other analytics.

*   **Scheduling and Appointment Endpoints:**

    *   Endpoints that let users book appointments and get AI recommendations on optimal booking times.
    *   Verify bookings and manage cancellations with real-time updates.

*   **Payment Endpoints:**

    *   Secure endpoints integrated with Stripe to handle payments. They ensure that all payment data is processed according to PCI DSS standards.

*   **Messaging Endpoints:**

    *   Handlers for sending messages via WhatsApp and fallback SMS via Twilio.
    *   Endpoints also support receiving and updating user messaging preferences.

*   **Admin Endpoints:**

    *   Endpoints for administrators to monitor user activities, system performance, and app status via an Appwrite powered dashboard.

## 5. Hosting Solutions

The backend is hosted in a cloud environment that supports continuous integration and deployment (CI/CD), ensuring rapid updates and minimal downtime. Key benefits include:

*   **Cloud Providers:** The system is hosted on leading cloud platforms which provide high availability and global scalability.
*   **CI/CD Pipelines:** Automated processes allow for speedy deployment of updates and bug fixes.
*   **Cost-Effectiveness:** Cloud hosting helps to scale resources up or down based on demand, which helps manage costs effectively.

## 6. Infrastructure Components

Several components work together to provide a reliable and performant backend:

*   **Load Balancers:** Ensure traffic is evenly distributed across servers to avoid any single point of overload.
*   **Caching Mechanisms:** Used for frequently accessed data to reduce load times and handle API rate limits efficiently.
*   **Content Delivery Networks (CDNs):** While mostly used by the frontend, CDNs are also in place to serve static assets quickly where needed.
*   **CI/CD Tools:** Automate builds, tests, and deployments to check that the backend stays current with the latest code changes without downtime.

## 7. Security Measures

Security is a top priority. Here’s how we keep data and user interactions safe:

*   **Authentication & Authorization:**

    *   OAuth through Google, Apple, and email ensures users are valid before accessing services.
    *   Role-based permissions limit what each user (car owner, garage operator, administrator) can do.

*   **Data Encryption:**

    *   Data is encrypted in transit and at rest to protect user information.
    *   Payment processing meets PCI DSS standards thanks to our Stripe integration.

*   **Compliance:**

    *   GDPR and the UK Data Protection Act 2018 are strictly adhered to.
    *   Regular reviews and updates to our security protocols ensure that as new threats emerge, the platform remains secure.

## 8. Monitoring and Maintenance

The health of the backend is continuously monitored using a variety of tools:

*   **Monitoring Tools:**

    *   Dashboards powered by Appwrite provide real-time tracking of user activity and system performance.
    *   Logging and error reporting tools detect issues before they become significant and help in quick troubleshooting.

*   **Maintenance Practices:**

    *   Regular scheduled maintenance windows to update systems without major downtime.
    *   Automated tests and CI/CD pipelines ensure that new code does not break existing functionalities.

## 9. Conclusion and Overall Backend Summary

To summarize, the GarageMunky backend is built on a robust set of components that work seamlessly together to support a feature-rich mobile application. Key highlights include:

*   A modular backend architecture that scales and adapts with user demands.
*   A flexible NoSQL database structure managed by Appwrite, ensuring swift and secure data access.
*   RESTful API endpoints connect the frontend to vital backend services, including authentication, vehicle data retrieval, appointment scheduling, secure payments, and messaging.
*   Hosting on a cloud platform with CI/CD pipelines ensures reliability, scalability, and cost-effectiveness.
*   Comprehensive infrastructure components such as load balancers, caching mechanisms, and CDNs collectively enhance performance.
*   High security standards through robust authentication, data encryption, and compliance with legal regulations.
*   Continuous monitoring and maintenance ensure that the backend stays healthy and up-to-date.

This setup not only supports the current needs of GarageMunky but is also designed to support future features and expansions, such as advanced messaging and additional language support. The structure provides a clear, maintainable, and secure foundation that differentiates GarageMunky from other vehicle management solutions.
