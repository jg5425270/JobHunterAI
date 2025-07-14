# JobFlow - Job Application Management System

## Overview

JobFlow is a full-stack job application management system built with modern web technologies. It provides a comprehensive platform for tracking job applications, managing email communications, and automating job search workflows across multiple platforms. The system features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-01-14: Added Tabbed Interface and Migration Documentation
- **Fixed Dashboard Tabs**: Added functional tabbed interface for job applications and email settings
- **Architecture Documentation**: Created comprehensive ARCHITECTURE.md with system design, security, and scalability details
- **Migration Guide**: Created MIGRATION_GUIDE.md with step-by-step instructions for deploying to free cloud services (Railway, Vercel, Fly.io, Render)
- **Deployment Script**: Added scripts/deploy.js for automated deployment preparation
- **Data Persistence**: Implemented backup/restore utilities for data migration
- **UI Components**: Added missing Switch component for email settings toggle

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with PostgreSQL store
- **Email Integration**: SendGrid for email services

### Database Schema
The system uses a PostgreSQL database with the following main tables:
- `sessions`: Session storage for authentication
- `users`: User profiles and account information
- `job_applications`: Job application records with status tracking
- `email_tracking`: Email communication logs and responses
- `user_settings`: User preferences and configuration
- `platform_credentials`: Encrypted platform authentication data
- `daily_stats`: Daily application metrics and analytics

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with 1-week TTL
- **Security**: HTTPS-only cookies with secure session handling
- **User Management**: Automatic user creation and profile updates

### Job Application Management
- **CRUD Operations**: Full create, read, update, delete functionality
- **Status Tracking**: Multiple status states (pending, responded, interview, offer, declined)
- **Platform Integration**: Support for multiple job platforms (Upwork, Freelancer, etc.)
- **Rich Metadata**: Job descriptions, pay rates, locations, and application URLs

### Email Integration
- **Email Tracking**: Automatic email response monitoring
- **Auto-Reply**: Configurable automated responses
- **Thread Management**: Email conversation tracking per job application
- **Sentiment Analysis**: Basic positive/negative response detection

### Analytics and Reporting
- **Dashboard Stats**: Real-time application metrics
- **Progress Tracking**: Weekly and daily application goals
- **Export Functionality**: CSV and JSON data export
- **Performance Metrics**: Success rates and response analytics

### Auto-Apply System
- **Smart Job Matching**: AI-powered job filtering based on skills and preferences
- **Interview-Free Focus**: Prioritizes positions requiring no interviews
- **Configurable Filters**: Pay rate, location, keywords, and requirement matching
- **Automated Application**: Hands-free job application submission
- **Real-time Monitoring**: Live status tracking and application metrics

### Contact Management
- **Contact Database**: Comprehensive contact storage with company and role information
- **Resume Distribution**: Bulk email campaigns to send resumes to contacts
- **Response Tracking**: Monitor email responses and follow-up activities
- **Industry Segmentation**: Organize contacts by industry and job function

### Resume Management
- **Template System**: Multiple resume templates for different industries
- **Skill Matching**: Templates optimized for specific skill sets
- **Version Control**: Track and manage different resume versions
- **Export Options**: Download resumes in various formats

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or updating user profiles
2. **Application Management**: Users create job applications through the dashboard or quick actions
3. **Email Processing**: System monitors email responses and categorizes them
4. **Analytics Generation**: Daily stats are computed and stored for dashboard display
5. **Settings Management**: User preferences control automation behavior

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Email Service**: SendGrid for email integration
- **Authentication**: Replit Auth service
- **UI Components**: Radix UI primitives with shadcn/ui wrapper

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Drizzle**: Type-safe database ORM with migrations
- **Vite**: Fast development server with HMR
- **TanStack Query**: Server state management with caching

### Security Features
- **Data Encryption**: Platform credentials encrypted with AES-256
- **Session Security**: Secure HTTP-only cookies
- **CSRF Protection**: Built-in Express session protection
- **Input Validation**: Zod schema validation for all inputs

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles Node.js server to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates

### Environment Configuration
- **Development**: Local development with tsx and Vite dev server
- **Production**: Single Node.js process serving static files and API
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Replit Integration
- **Development Mode**: Vite plugin for Replit development banner
- **Error Handling**: Runtime error modal for development
- **Hot Reload**: Full HMR support for rapid development

The system is designed as a monorepo with shared TypeScript types between frontend and backend, ensuring type safety across the entire application stack.