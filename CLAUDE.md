# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Generate Prisma client (runs automatically after npm install)
- `npm run create-admin` - Create admin user using script/create-admin.js

### Database Operations
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma migrate dev` - Create and apply new migration

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.1 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth and credentials
- **Styling**: Tailwind CSS
- **File Storage**: Cloudinary for image management
- **State Management**: React Context API
- **UI Components**: Custom components with Lucide React icons

### Core Application Domains

#### 1. Property Inventory Management
- **Properties**: Real estate properties with address, rooms, and metadata
- **Rooms**: Categorized spaces within properties with image galleries
- **Room Images**: Photos with AI-detected descriptions, conditions, and notes
- **Inventory Sessions**: Time tracking for inventory work
- **Sync System**: Mobile app synchronization with conflict resolution

#### 2. Canvassing System
- **Canvassing Visits**: GPS-tracked visits with contact methods and responses
- **Contact Methods**: DOOR, PHONE, EMAIL, LETTER, SMS, BROCHURE, VALUATION_CARD
- **Response Tracking**: positive, negative, no_response, pending responses
- **Geographic Data**: Latitude/longitude with optional address geocoding

#### 3. User Management & Authentication
- **Role-Based Access**: ADMIN and USER roles with granular permissions
- **Authentication Types**: LOCAL (email/password) and GOOGLE OAuth
- **Account Status**: Active/inactive user management
- **Property Sharing**: Fine-grained sharing with edit/delete permissions

### Database Schema Key Points

#### Core Models
- **User**: Role-based with isActive status, supports both auth types
- **Property**: Inventory status tracking (DRAFT, COMPLETED, FINALIZED)
- **Room**: Organized spaces with completion tracking and sort order
- **RoomImage**: Rich metadata with AI detection and sync status
- **CanvassingVisit**: GPS-tracked visits with response management
- **PropertyShare**: User-property access control with permission levels

#### Performance Optimizations
- Denormalized counts (roomCount, imageCount) for dashboard performance
- Strategic database indexes on common query patterns
- Sort order fields for consistent UI ordering

### Authentication Architecture

#### NextAuth Configuration
- **Session Strategy**: JWT with 30-day expiration
- **Custom Adapter**: CustomPrismaAdapter for enhanced user management
- **Google Integration**: Automatic user linking and auth type updates
- **Active Status Enforcement**: Inactive users blocked at JWT and session level

#### Authorization Patterns
- **Middleware**: Route protection at `/src/middleware.ts`
- **Role-Based Routes**: Admin-only sections with RoleBasedRoute component
- **API Security**: Role and ownership validation in all API routes

### File Storage Strategy
- **Cloudinary Integration**: Centralized image management and optimization
- **Path Conventions**: Organized by property/room for easy cleanup
- **Sync Support**: LocalId tracking for mobile app synchronization

### API Structure

#### Route Organization
- `/api/auth/*` - Authentication endpoints (NextAuth)
- `/api/properties/*` - Property CRUD with nested room/image operations
- `/api/users/*` - User management with admin controls
- `/api/canvassingvisits/*` - Canvassing visit management
- `/api/sync/*` - Mobile app synchronization endpoints
- `/api/dashboard/*` - Analytics and dashboard data

#### Common Patterns
- **Service Layer**: Business logic in `/src/lib/services/`
- **Type Safety**: TypeScript interfaces in service files
- **Error Handling**: Consistent HTTP status codes and error messages
- **Validation**: Input validation middleware

### Mobile App Integration

#### Synchronization System
- **Conflict Resolution**: SyncLog tracking with status management
- **Batch Operations**: Bulk room and image upload endpoints
- **Offline Support**: LocalId mapping for offline-first mobile experience
- **Status Tracking**: "pending", "synced", "conflict" states

### Development Patterns

#### Component Architecture
- **Layout Components**: Consistent navigation and auth wrappers
- **Property Components**: Modular property management UI in `/src/components/property/`
- **Auth Components**: Reusable authentication and authorization wrappers
- **UI Components**: Shared components in `/src/components/ui/`

#### State Management
- **AuthContext**: User session and role management
- **Server State**: API routes handle most state, minimal client state
- **Form Handling**: Direct API integration with toast notifications

### Key Integrations

#### Cloudinary Setup
- Domain configuration in next.config.ts for image optimization
- Helper utilities in `/src/lib/utils/cloudinaryHelpers.ts`
- Automatic image format optimization (AVIF, WebP)

#### Prisma Configuration
- PostgreSQL database with comprehensive indexing
- Generated client in `/src/generated/prisma/`
- Custom adapter for NextAuth integration

## Important Notes

- ESLint errors are ignored during builds (configured in next.config.ts)
- All image domains must be configured in next.config.ts for Next.js Image component
- Database migrations should be created for schema changes before pushing to production
- The application supports both mobile and desktop inventory workflows
- GPS coordinates are required for canvassing visits and used for proximity validation