# SillyTavern v2

LLM Frontend for Power Users - Rebuilt with modern architecture

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Rust + Actix-web + async-graphql
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Rust 1.75+ (for local development)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/SillyTavern/SillyTavern-v2.git
cd SillyTavern-v2

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# GraphQL Playground: http://localhost:8080/graphql
# MinIO Console: http://localhost:9001
```

### Local Development

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd services/gateway
cargo run
```

## API Documentation

### GraphQL Endpoint

- **URL**: `http://localhost:8080/graphql`
- **WebSocket**: `ws://localhost:8080/graphql/ws`

### Example Queries

```graphql
# Get current user
query {
  me {
    id
    username
    email
  }
}

# Get characters
query {
  characters(limit: 10) {
    id
    name
    description
  }
}
```

## Development

See [docs/development.md](docs/development.md) for detailed development guidelines.

## License

AGPL-3.0
