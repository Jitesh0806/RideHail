# 🚗 RideHail — Cloud-Native Ride-Hailing Platform

A full-stack, production-ready ride-hailing system built with modern cloud architecture.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud (Phase 1)                       │
│                                                                   │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Rider   │    │  API Gateway  │    │  NestJS Backend      │   │
│  │  Mobile  │◄──►│  (HTTPS/WSS) │◄──►│  (EC2 / ECS)        │   │
│  │  (RN)    │    └──────────────┘    │                      │   │
│  └──────────┘                        │  ┌────────────────┐  │   │
│                                      │  │  PostgreSQL     │  │   │
│  ┌──────────┐                        │  │  (RDS)         │  │   │
│  │  Driver  │    ┌──────────────┐    │  └────────────────┘  │   │
│  │  Mobile  │◄──►│  WebSocket   │◄──►│  ┌────────────────┐  │   │
│  │  (RN)    │    │  (Socket.IO) │    │  │  Redis Cache    │  │   │
│  └──────────┘    └──────────────┘    │  │  (ElastiCache) │  │   │
│                                      │  └────────────────┘  │   │
│  ┌──────────┐    ┌──────────────┐    └──────────────────────┘   │
│  │  Admin   │◄──►│  React Admin │         │          │           │
│  │  Panel   │    │  Dashboard   │      AWS S3      AWS SNS       │
│  │  (React) │    └──────────────┘    (Storage)  (Push Notifs)   │
│  └──────────┘                                                     │
│                            AWS Cognito (Auth)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS (Node.js) + TypeScript |
| **Mobile** | React Native (iOS + Android) |
| **Admin** | React + Tailwind CSS |
| **Database** | PostgreSQL (AWS RDS) |
| **Cache** | Redis (AWS ElastiCache) |
| **Real-Time** | WebSockets (Socket.IO) |
| **Auth** | JWT + AWS Cognito |
| **Storage** | AWS S3 |
| **Notifications** | AWS SNS |
| **Payments** | Stripe |
| **Containerization** | Docker |
| **CI/CD** | GitHub Actions → AWS ECR/ECS |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### 1. Clone & Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
```

### 2. Start with Docker Compose (Recommended)

```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

### 3. Start Backend Standalone

```bash
cd backend
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### 4. Start Admin Panel

```bash
cd admin
npm install
npm start
# Admin: http://localhost:3001
```

### 5. Mobile App

```bash
cd mobile
npm install
# iOS
npx react-native run-ios
# Android
npx react-native run-android
```

---

## 📡 API Documentation

Swagger UI available at `http://localhost:3000/api/docs` in development.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/rider/register` | Register rider |
| `POST` | `/api/v1/auth/driver/register` | Register driver |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/rides/request` | Request a ride |
| `POST` | `/api/v1/rides/:id/accept` | Driver accept ride |
| `PATCH` | `/api/v1/rides/:id/status` | Update ride status |
| `GET` | `/api/v1/locations/nearby-drivers` | Get nearby drivers |
| `GET` | `/api/v1/admin/dashboard` | Admin dashboard stats |
| `POST` | `/api/v1/admin/drivers/:id/approve` | Approve driver |

---

## ⚡ Real-Time WebSocket Events

Connect to: `ws://localhost:3000/ridehail`

### Client → Server
| Event | Description |
|-------|-------------|
| `driver:location_update` | Driver sends GPS location |
| `driver:go_online` | Driver goes available |
| `driver:go_offline` | Driver goes offline |
| `ride:join` | Join ride room for updates |

### Server → Client
| Event | Description |
|-------|-------------|
| `driver:location` | Live driver GPS coordinates |
| `ride:request` | New ride request (to driver) |
| `ride:status_update` | Ride status changed |
| `driver:status_updated` | Driver status confirmed |

---

## 🔄 Ride Flow

```
Rider requests ride
        │
        ▼
Backend searches drivers (3km radius)
        │
        ├── No drivers found → expand to 5km (2min)
        │   └── Expand to 8km → 10km → notify rider
        │
        └── Driver found → push notification + WebSocket
                │
                ▼
        Driver accepts → status: driver_assigned
                │
                ▼
        Driver navigates → status: driver_en_route
        (real-time GPS every 5s via WebSocket)
                │
                ▼
        Driver arrives → status: driver_arrived
                │
                ▼
        Trip starts → status: in_progress
                │
                ▼
        Trip completes → payment charged → ratings prompt
```

---

## ☁️ AWS Services Used

| Service | Usage |
|---------|-------|
| **EC2 / ECS** | Backend hosting |
| **RDS (PostgreSQL)** | Primary database |
| **ElastiCache (Redis)** | Caching driver locations |
| **S3** | Profile pics, driver documents |
| **Cognito** | User authentication |
| **SNS** | Push notifications |
| **API Gateway** | HTTP + WebSocket routing |
| **CloudWatch** | Monitoring & logging |
| **VPC** | Network isolation |

---

## 🐳 Deployment Phases

### Phase 1 (Current): EC2 + Docker
```
GitHub Actions → Docker Build → ECR → ECS (EC2 mode)
```

### Phase 2: Add auto-scaling
```
ECS + Application Auto Scaling based on CPU/memory
```

### Phase 3: Kubernetes (EKS) + Microservices
```
Break into: auth-service, ride-service, location-service,
            notification-service, payment-service
Each service independently deployable with HPA
```

---

## 📊 Database Schema

Key tables: `users`, `drivers`, `rides`, `payments`, `ratings`, `location_history`

---

## 🔐 Environment Variables

See `backend/.env.example` for all required variables.

**Required for production:**
- `JWT_SECRET` (min 32 chars)
- `DB_*` (PostgreSQL connection)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `STRIPE_SECRET_KEY`
- `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID`

---

## 📱 Mobile App Features

### Rider
- Sign up / Login
- Enter pickup & destination
- View nearby drivers on map (live markers)
- Select vehicle type (Economy/Standard/Premium/XL)
- Track driver in real-time
- Rate driver after trip
- View ride history

### Driver
- Register with license & vehicle info
- Go online/offline toggle
- Receive ride requests with Accept/Reject
- Navigate to rider → start trip → complete trip
- View earnings dashboard

---

## 🛡️ Admin Dashboard Features

- **Dashboard**: Real-time stats (users, active rides, revenue)
- **Active Rides**: Monitor all rides, force cancel
- **Users**: Search, suspend, reactivate
- **Drivers**: View all, suspend
- **Pending Approvals**: Review & approve/reject new drivers
- **Analytics**: Peak hours, completion rates, revenue breakdown
