# PostgreSQL Setup Options

You have PostgreSQL already running on port 5432. Here are your options:

## Option 1: Use Existing PostgreSQL (Recommended)

If you already have PostgreSQL installed and running, you can use it instead of Docker.

### Steps:

1. **Create the database**:
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   # Or if you have a postgres user:
   psql -U postgres
   ```

2. **Create database and user**:
   ```sql
   CREATE DATABASE soundboard;
   CREATE USER soundboard WITH PASSWORD 'soundboard';
   GRANT ALL PRIVILEGES ON DATABASE soundboard TO soundboard;
   \q
   ```

3. **Update your `.env` file**:
   ```env
   DATABASE_URL=postgresql://soundboard:soundboard@localhost:5432/soundboard
   ```

4. **Run migrations**:
   ```bash
   cd backend
   source venv/bin/activate
   alembic upgrade head
   ```

## Option 2: Use Docker with Different Port

The docker-compose.yml has been updated to use port **5433** instead of 5432.

### Steps:

1. **Update your `.env` file**:
   ```env
   DATABASE_URL=postgresql://soundboard:soundboard@localhost:5433/soundboard
   ```

2. **Start Docker container**:
   ```bash
   cd /home/lwebkepyes4802/Desktop/soundboard
   docker compose up -d postgres
   ```

3. **Run migrations**:
   ```bash
   cd backend
   source venv/bin/activate
   alembic upgrade head
   ```

## Option 3: Stop Local PostgreSQL and Use Docker

If you want to use Docker on the default port:

1. **Stop local PostgreSQL**:
   ```bash
   sudo systemctl stop postgresql
   # Or disable it permanently:
   sudo systemctl disable postgresql
   ```

2. **Update docker-compose.yml** back to port 5432:
   ```yaml
   ports:
     - "5432:5432"
   ```

3. **Start Docker container**:
   ```bash
   cd /home/lwebkepyes4802/Desktop/soundboard
   docker compose up -d postgres
   ```

4. **Update `.env`**:
   ```env
   DATABASE_URL=postgresql://soundboard:soundboard@localhost:5432/soundboard
   ```

5. **Run migrations**:
   ```bash
   cd backend
   source venv/bin/activate
   alembic upgrade head
   ```

## Quick Test

After setup, test the connection:

```bash
# For local PostgreSQL (port 5432)
psql postgresql://soundboard:soundboard@localhost:5432/soundboard

# For Docker PostgreSQL (port 5433)
psql postgresql://soundboard:soundboard@localhost:5433/soundboard
```

## Recommendation

**Option 1** is usually best if you already have PostgreSQL set up - it's simpler and doesn't require Docker. Just create the database and user, then update your `.env` file.
