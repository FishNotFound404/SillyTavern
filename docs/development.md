# Development Guide

## Project Structure

```
sillytavern-v2/
├── frontend/          # React frontend
├── services/          # Rust microservices
│   └── gateway/       # API Gateway
├── infrastructure/    # Docker and deployment configs
│   └── postgres/      # Database initialization
└── docs/             # Documentation
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the coding standards for each language:

#### Frontend (TypeScript/React)

- Use TypeScript for all new code
- Follow React best practices
- Use Tailwind CSS for styling
- Write tests with Vitest

#### Backend (Rust)

- Follow Rust naming conventions
- Use async/await for async operations
- Write documentation comments
- Add tests for new functionality

### 3. Test Your Changes

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd services/gateway
cargo test
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: description of your changes"
```

### 5. Create a Pull Request

```bash
git push origin feature/your-feature-name
```

## Environment Variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_GRAPHQL_URL | GraphQL endpoint URL | http://localhost:8080/graphql |
| VITE_WS_URL | WebSocket URL | ws://localhost:8080/graphql/ws |

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| REDIS_URL | Redis connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRATION | JWT expiration in seconds | 86400 |
| SERVER_HOST | Server bind address | 0.0.0.0 |
| SERVER_PORT | Server port | 8080 |
| RUST_LOG | Log level | info |

## Debugging

### Frontend

Use browser developer tools and React DevTools.

### Backend

```bash
RUST_LOG=debug cargo run
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using the port (Windows)
   netstat -ano | findstr :3000
   # Kill the process
   taskkill /PID <PID> /F
   ```

2. **Database connection failed**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL is correct
   - Check network connectivity

3. **Build errors**
   - Clear node_modules and reinstall
   - Clear cargo target directory
   - Check for syntax errors
