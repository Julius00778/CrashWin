# Overview

CrashWin India is a real-time crash gambling game application built with a modern full-stack architecture. Players can place bets on a multiplier that continuously increases until it "crashes" at a random point. The goal is to cash out before the crash to win money based on the current multiplier. The application features live game mechanics, real-time chat, user statistics, and a leaderboard system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket client for live game updates and chat

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time Engine**: Custom CrashEngine class using EventEmitter for game logic
- **WebSocket Server**: ws library for real-time bidirectional communication
- **Session Management**: Express sessions with PostgreSQL session store
- **Game Logic**: Deterministic crash algorithm using cryptographic hashing for fairness

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Relational tables for users, games, bets, and chat messages
- **Connection**: Neon Database serverless PostgreSQL instance
- **Migrations**: Drizzle Kit for database schema management
- **Development Storage**: In-memory storage implementation for rapid development

## Authentication & Authorization
- **Strategy**: Session-based authentication with default user system
- **Session Store**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Simple username/password system with balance tracking

## Game Engine Design
- **Fairness**: Provably fair system using SHA-256 hashing with server seeds
- **Multiplier Calculation**: Deterministic algorithm based on cryptographic hashes
- **Game Phases**: Structured state machine (waiting → starting → flying → crashed)
- **Betting Logic**: Real-time bet placement and auto-cashout functionality
- **Timer Management**: Precise game timing with configurable durations

## Real-time Features
- **Game State Synchronization**: Live multiplier updates via WebSocket
- **Chat System**: Real-time messaging with user identification
- **Live Statistics**: Dynamic leaderboards and user statistics
- **Connection Management**: Automatic reconnection with exponential backoff

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **drizzle-zod**: Schema validation integration between Drizzle and Zod
- **ws**: WebSocket library for real-time server communication
- **express**: Web application framework for REST API and static file serving

## UI and Styling
- **@radix-ui/***: Comprehensive suite of unstyled UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework for responsive design
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Utility for conditional CSS class names

## State Management and Data Fetching
- **@tanstack/react-query**: Server state management with caching and synchronization
- **react-hook-form**: Form handling with validation and performance optimization
- **@hookform/resolvers**: Validation resolvers for various schema libraries

## Development and Build Tools
- **vite**: Fast build tool and development server with HMR
- **typescript**: Static type checking for enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution environment for development

## Utility Libraries
- **date-fns**: Modern date utility library for time formatting
- **nanoid**: Secure URL-friendly unique ID generator
- **cmdk**: Command menu component for enhanced UX
- **embla-carousel-react**: Touch-friendly carousel component