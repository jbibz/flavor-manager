# Flavor Junkie - Self-Hosted Setup Guide

This application now uses a self-hosted PostgreSQL database instead of Supabase, giving you full control over your data.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git (for cloning)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the PostgreSQL Database

```bash
npm run db:up
```

This will start a PostgreSQL database in a Docker container. The database will automatically run the migrations on first startup.

### 3. Configure Environment Variables

The `.env` file is already configured with default values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flavor_junkie
DB_USER=postgres
DB_PASSWORD=postgres

VITE_API_URL=http://localhost:3001/api

PORT=3001
```

For production, update these values with your actual database credentials.

### 4. Start the Application

**Option A: Start both frontend and backend together**
```bash
npm run dev:all
```

**Option B: Start them separately**

Terminal 1 (Backend API):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:server` - Start backend API server
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run server` - Start backend in production mode
- `npm run db:up` - Start PostgreSQL database
- `npm run db:down` - Stop PostgreSQL database
- `npm run db:reset` - Reset database (deletes all data)

## Database Management

### Viewing Database Contents

Connect to the database using any PostgreSQL client:

```bash
# Using psql
psql -h localhost -U postgres -d flavor_junkie

# Or use a GUI tool like pgAdmin, DBeaver, or TablePlus
```

### Backup Database

```bash
docker exec flavor-junkie-db pg_dump -U postgres flavor_junkie > backup.sql
```

### Restore Database

```bash
docker exec -i flavor-junkie-db psql -U postgres flavor_junkie < backup.sql
```

## Database Schema

The database includes these tables:
- `products` - Product inventory
- `sales_events` - Sales tracking
- `sales_items` - Individual sale items
- `production_batches` - Production history
- `component_purchases` - Component purchase history
- `dashboard_notes` - Dashboard notes
- `components` - Raw materials (partial support)
- `recipes` - Product recipes (partial support)

## Production Deployment

### Using Your Own Server

1. Install PostgreSQL on your server
2. Update `.env` with your database credentials
3. Run migrations manually:
   ```bash
   psql -U your_user -d your_database -f supabase/migrations/20251202220748_create_flavor_junkie_schema.sql
   psql -U your_user -d your_database -f supabase/migrations/20251202220819_seed_initial_data.sql
   ```
4. Build the frontend: `npm run build`
5. Serve the `dist` folder with a web server (nginx, Apache, etc.)
6. Run the backend: `npm run server`

### Using Docker for Both App and Database

You can extend the `docker-compose.yml` to include the application:

```yaml
services:
  postgres:
    # ... existing config ...

  api:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: flavor_junkie
      DB_USER: postgres
      DB_PASSWORD: postgres
```

## Troubleshooting

### Database Connection Errors

1. Make sure Docker is running
2. Check if PostgreSQL container is running: `docker ps`
3. Verify database is ready: `docker logs flavor-junkie-db`

### Port Already in Use

If port 5432 or 3001 is already in use, update the ports in:
- `docker-compose.yml` (for database)
- `.env` (for API and database connection)

### Data Migration from Supabase

If you were previously using Supabase, export your data:
1. Go to Supabase dashboard
2. Use SQL Editor to export each table
3. Import into your local database

## Security Notes

- Change default PostgreSQL password in production
- Use environment variables for sensitive data
- Set up proper firewall rules
- Enable SSL for database connections in production
- Keep your database backed up regularly

## Support

For issues or questions, check the application logs:
- Backend: Console output from `npm run dev:server`
- Database: `docker logs flavor-junkie-db`
