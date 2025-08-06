# Clinic Management API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## Overview

This is a comprehensive Clinic Management API built with NestJS, designed to handle all aspects of clinic operations including patient management, doctor scheduling, appointments, medical records, billing, and more. The API provides a robust backend for clinic management systems with role-based access control and complete audit capabilities.

## Features

- **User Management**: Complete user management with role-based access control
- **Patient Management**: Store and manage patient information and medical history
- **Doctor Management**: Manage doctor profiles, specializations, and clinic assignments
- **Appointment Scheduling**: Book, reschedule, and manage patient appointments
- **Medical Records**: Track examinations, progression notes, and treatment plans
- **Billing System**: Generate invoices and manage payments
- **Wallet System**: Manage patient wallets and transactions
- **Audit Trail**: Track all system activities for compliance and security

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: Class-validator and class-transformer
- **Password Hashing**: Argon2

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

```bash
# Clone the repository
$ git clone <repository-url>

# Navigate to the project directory
$ cd clinic-api

# Install dependencies
$ npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/clinic_db?schema=public"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="15m"
REFRESH_SECRET="your-refresh-secret"
REFRESH_EXPIRATION="7d"

# Application
PORT=3030
FRONTEND_URL="http://localhost:3000"
```

## Database Setup

```bash
# Generate Prisma client
$ npx prisma generate

# Run migrations
$ npx prisma migrate dev

# Seed the database with initial data
$ npm run seed
```

## Running the Application

```bash
# Development mode
$ npm run start:dev

# Production mode
$ npm run build
$ npm run start:prod
```

The API will be available at `http://localhost:3030/api/v1`

## API Endpoints

The API is organized into the following modules:

- `/api/v1/auth` - Authentication endpoints
- `/api/v1/users` - User management
- `/api/v1/roles` - Role management
- `/api/v1/permissions` - Permission management
- `/api/v1/patients` - Patient management
- `/api/v1/doctors` - Doctor management
- `/api/v1/clinic` - Clinic management
- `/api/v1/appointments` - Appointment scheduling
- `/api/v1/medical-records` - Medical records management
- `/api/v1/invoices` - Billing and invoices
- `/api/v1/wallets` - Patient wallet management

## Testing

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## Project Structure

```
├── prisma/                  # Prisma schema and migrations
├── src/
│   ├── app.module.ts        # Main application module
│   ├── auth/                # Authentication module
│   ├── commands/            # CLI commands (e.g., seeding)
│   ├── common/              # Shared utilities, guards, decorators
│   ├── config/              # Application configuration
│   ├── modules/             # Feature modules
│   │   ├── appointments/    # Appointment management
│   │   ├── audit/           # Audit trail
│   │   ├── clinic/          # Clinic management
│   │   ├── doctors/         # Doctor management
│   │   ├── invoices/        # Billing and invoices
│   │   ├── medical-records/ # Medical records
│   │   ├── patients/        # Patient management
│   │   ├── permissions/     # Permission management
│   │   ├── roles/           # Role management
│   │   ├── users/           # User management
│   │   └── wallets/         # Wallet management
│   └── prisma/              # Prisma service
└── test/                    # End-to-end tests
```

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For support, please contact the development team or open an issue in the repository.
