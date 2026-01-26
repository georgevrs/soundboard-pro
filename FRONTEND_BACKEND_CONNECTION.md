# Frontend-Backend Connection Guide

## ✅ Status: Connected!

The frontend is now connected to the backend API. Here's what was set up:

## What Was Done

1. **Created API Client** (`src/lib/api.ts`)
   - All API endpoints for sounds, shortcuts, settings, and playback
   - Base URL: `http://localhost:8000/api` (configurable via env)

2. **Created React Query Hooks** (`src/hooks/`)
   - `useSounds.ts` - Fetch and manage sounds
   - `useShortcuts.ts` - Fetch and manage shortcuts
   - `usePlayback.ts` - Control playback
   - `useSettings.ts` - Manage settings

3. **Created Data Transformers** (`src/lib/apiTransform.ts`)
   - Converts backend snake_case to frontend camelCase
   - Handles date string to Date object conversion

4. **Updated Main Page** (`src/pages/Index.tsx`)
   - Replaced mock data with API calls
   - Added loading and error states
   - Integrated playback controls

## Configuration

### Environment Variables

Create a `.env` file in the project root (same level as `package.json`):

```env
VITE_API_URL=http://localhost:8000/api
```

Or use the default (already configured):
- Default: `http://localhost:8000/api`

### Backend CORS

Make sure your backend `.env` includes the frontend URL:

```env
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000
```

(Note: Your Vite config shows port 8080, but default is 5173)

## Running the Application

### 1. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Backend runs on: `http://localhost:8000`

### 2. Start Frontend

```bash
npm run dev
```

Frontend runs on: `http://localhost:8080` (or 5173 if using default Vite)

### 3. Test Connection

1. Open browser console (F12)
2. Check Network tab for API calls
3. You should see requests to `http://localhost:8000/api/sounds`

## API Endpoints Used

- `GET /api/sounds` - List all sounds
- `GET /api/shortcuts` - List all shortcuts
- `POST /api/playback/play/{sound_id}` - Play a sound
- `POST /api/playback/stop/{sound_id}` - Stop a sound
- `POST /api/playback/toggle/{sound_id}` - Toggle playback
- `GET /api/playback/now-playing` - Get currently playing sounds

## Troubleshooting

### "Failed to fetch" Error

1. **Check backend is running**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check CORS settings** in backend `.env`:
   ```env
   CORS_ORIGINS=http://localhost:8080
   ```

3. **Check browser console** for CORS errors

### "Network Error" or "Connection Refused"

- Backend not running - start it with `uvicorn app.main:app --reload`
- Wrong port - check backend is on port 8000
- Firewall blocking - check firewall settings

### Data Not Loading

- Check backend database is set up: `alembic upgrade head`
- Check backend logs for errors
- Verify API endpoint in browser Network tab

### Playback Not Working

- Check `mpv` is installed: `mpv --version`
- Check audio device in backend settings
- Check backend logs for mpv errors

## Next Steps

1. **Add more features**:
   - Create/Edit sounds form
   - Upload cover images
   - YouTube ingestion UI
   - Shortcut management UI

2. **Error handling**:
   - Better error messages
   - Retry logic
   - Offline detection

3. **Optimizations**:
   - Caching strategies
   - Optimistic updates
   - Debounced search

## Testing the Connection

1. **Check API is accessible**:
   ```bash
   curl http://localhost:8000/api/sounds
   ```

2. **Check frontend can call API**:
   - Open browser DevTools → Network tab
   - Reload the page
   - Look for requests to `localhost:8000`

3. **Test playback**:
   - Add a sound via API or UI
   - Click play button
   - Check backend logs for mpv command

## Files Changed

- ✅ `src/lib/api.ts` - API client
- ✅ `src/lib/apiTransform.ts` - Data transformers
- ✅ `src/hooks/useSounds.ts` - Sounds hooks
- ✅ `src/hooks/useShortcuts.ts` - Shortcuts hooks
- ✅ `src/hooks/usePlayback.ts` - Playback hooks
- ✅ `src/hooks/useSettings.ts` - Settings hooks
- ✅ `src/pages/Index.tsx` - Main page (now uses API)

The frontend is now fully connected to the backend! 🎉
