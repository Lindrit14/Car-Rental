# Car Rental Frontend

React frontend for the Car Rental web service. Consumes the car-rental REST API to manage cars, users, and authentication.

## Tech Stack

- React 19
- TypeScript
- Vite
- TailwindCSS 4

## Prerequisites

- Node.js 18+
- Car Rental backend running on `http://localhost:8080`

## Getting Started

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

## Project Structure

```
src/
  api/          # API client and endpoint functions
    client.ts   # Generic fetch wrapper with JWT auth
    auth.ts     # Login & register endpoints
    cars.ts     # Car CRUD endpoints
  context/      # React context providers
    AuthContext.tsx
  pages/        # Page components
    CarList.tsx
    Login.tsx
    Register.tsx
  types/        # TypeScript type definitions
    index.ts
  App.tsx        # Routing and layout
  main.tsx       # Entry point
```

## API Endpoints

The frontend consumes the following backend endpoints:

| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | `/api/user/register` | Register new user  |
| POST   | `/api/user/login`    | User login         |
| GET    | `/api/car`           | Get all cars       |
| POST   | `/api/car`           | Create a car       |
| PATCH  | `/api/car/{carId}`   | Update a car       |
