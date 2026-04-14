# 🚗 RideHail — Cloud-Native Ride-Hailing Platform

A full-stack, production-ready ride-hailing system built with modern cloud architecture.

---

## 📐 Architecture Overview

| Component | Technology | AWS Service |
|-----------|-----------|-------------|
| Mobile App (Rider + Driver) | React Native + Expo SDK 53 | — |
| Admin Panel | React + Vite | — |
| Backend API | NestJS + TypeScript | EC2 (t3.micro) |
| Load Balancer | HTTP (port 8080) | ALB |
| Database | PostgreSQL 15 | RDS |
| Cache | Redis 7 | ElastiCache |
| File Storage | — | S3 |
| Notifications | — | SNS |
| Container Registry | Docker | ECR |
| Networking | — | VPC |
| Real-Time | Socket.IO (WebSocket) | — |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS (Node.js) + TypeScript |
| **Mobile** | React Native + Expo SDK 53 |
| **Admin** | React + Vite + Tailwind CSS |
| **Database** | PostgreSQL 15 (AWS RDS) |
| **Cache** | Redis 7 (AWS ElastiCache) |
| **Real-Time** | WebSockets (Socket.IO) |
| **Auth** | JWT (Access + Refresh tokens) |
| **Storage** | AWS S3 |
| **Notifications** | AWS SNS |
| **Payments** | Stripe |
| **Containerization** | Docker + AWS ECR |
| **Infrastructure** | Terraform (IaC) |
| **Maps** | Google Maps (react-native-maps) |

---

## ☁️ AWS Services Used

| Service | Usage |
|---------|-------|
| **EC2 (t3.micro)** | Backend hosting (Docker container) |
| **RDS (PostgreSQL 15)** | Primary database |
| **ElastiCache (Redis 7)** | Caching, session management |
| **S3** | Profile pics, driver documents |
| **SNS** | Push notifications |
| **ALB** | Load balancer (port 8080 → 3000) |
| **VPC** | Network isolation (public + private subnets) |
| **ECR** | Docker image registry |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker
- AWS CLI (for deployment)
- Terraform (for infrastructure)
- EAS CLI (for mobile builds)

---

### 1. Backend (Local)

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

---

### 2. Admin Panel (Local)

```bash
cd admin
npm install
npm start
# Admin: http://localhost:3001
```

---

### 3. Mobile App (Expo)

```bash
cd mobile-expo
cp .env.example .env
# Set EXPO_PUBLIC_API_URL in .env
npm install --legacy-peer-deps

# Run with Expo Go (no maps)
npx expo start

# Build APK with native maps (EAS Build)
eas build --platform android --profile development
```

> react-native-maps requires a native build via EAS. Expo Go does not support it.

---

### 4. Infrastructure (AWS via Terraform)

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in your values (RDS password, JWT secrets, etc.)

terraform init
terraform plan
terraform apply
# Provisions: VPC, EC2, RDS, ElastiCache, S3, SNS, ALB
```

---

### 5. Deploy Backend to EC2

```bash
# Build and push Docker image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t ridehail-backend ./backend
docker tag ridehail-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ridehail-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ridehail-backend:latest
```

---

## 📡 API Documentation

Swagger UI: `http://localhost:3000/api/docs`

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
        ├── No drivers found → expand to 5km → 8km → 10km
        │
        └── Driver found → WebSocket notification
                │
                ▼
        Driver accepts → status: driver_assigned
                │
                ▼
        Driver navigates → real-time GPS every 5s
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

## 🔐 Environment Variables

### Backend (`backend/.env`)
```
NODE_ENV=production
PORT=3000
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=ridehail
DB_USER=ridehail_user
DB_PASSWORD=<your-password>
REDIS_HOST=<elasticache-endpoint>
REDIS_PORT=6379
JWT_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your-bucket>
AWS_SNS_TOPIC_ARN=<your-topic-arn>
STRIPE_SECRET_KEY=<your-stripe-key>
```

### Mobile (`mobile-expo/.env`)
```
EXPO_PUBLIC_API_URL=http://<your-ec2-ip>:3000
```

### Admin (`admin/.env`)
```
VITE_API_URL=http://<your-ec2-ip>:3000/api/v1
```

---

## 📱 Mobile App Features

### Rider
- Sign up / Login
- Enter pickup & destination
- View nearby drivers on map (live markers)
- Select vehicle type (Economy / Standard / Premium / XL)
- Track driver in real-time
- Rate driver after trip
- View ride history

### Driver
- Register with license & vehicle info
- Go online/offline toggle
- Receive ride requests with Accept / Reject
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

---

## 📊 Database Schema

Key tables: `users`, `drivers`, `rides`, `payments`, `ratings`, `location_history`
