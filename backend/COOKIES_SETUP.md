# YouTube Cookies Setup Guide

## Why Cookies?

YouTube often blocks downloads with 403 Forbidden errors. Using cookies from your browser makes yt-dlp appear as a "real" browser session, significantly improving download success rates.

## Quick Setup

### Option 1: Use Browser Cookies (Easiest - Recommended)

1. **Edit `.env` file:**
   ```bash
   cd backend
   nano .env
   ```

2. **Add this line:**
   ```env
   YTDLP_COOKIES_FROM_BROWSER=chrome
   ```
   
   Or for Firefox:
   ```env
   YTDLP_COOKIES_FROM_BROWSER=firefox
   ```

3. **Restart backend server**

### Option 2: Use Cookies File

1. **Export cookies from browser:**
   - Use a browser extension like "Get cookies.txt LOCALLY" (Chrome/Firefox)
   - Or use `yt-dlp --cookies-from-browser chrome --cookies cookies.txt --dump-json URL` to export

2. **Save cookies file:**
   ```bash
   # Save to backend directory or anywhere accessible
   cp cookies.txt backend/cookies.txt
   ```

3. **Edit `.env` file:**
   ```env
   YTDLP_COOKIES_FILE=./cookies.txt
   ```

4. **Restart backend server**

## Supported Browsers

- `chrome` - Google Chrome / Chromium
- `firefox` - Mozilla Firefox
- `edge` - Microsoft Edge
- `safari` - Safari (macOS)
- `opera` - Opera
- `brave` - Brave Browser

## How It Works

When you set `YTDLP_COOKIES_FROM_BROWSER=chrome`, yt-dlp will:
1. Read cookies from your Chrome browser profile
2. Use those cookies when downloading from YouTube
3. Appear as a logged-in browser session
4. Bypass most 403 Forbidden errors

## Security Note

- Cookies are read from your local browser profile
- No cookies are stored by the application
- Cookies are only used during the download process
- Your browser session remains private

## Troubleshooting

### "Cookies not found"
- Make sure the browser is installed
- Try a different browser (e.g., `firefox` instead of `chrome`)
- On Linux, you may need to specify the profile path

### Still getting 403 errors
1. Make sure you're logged into YouTube in that browser
2. Try exporting cookies to a file instead
3. Update yt-dlp: `pip install -U yt-dlp`
4. Enable verbose logging: `YTDLP_VERBOSE=true` to see detailed errors

### Cookies file not found
- Check the path in `.env` is correct
- Use absolute path: `/full/path/to/cookies.txt`
- Make sure the file exists and is readable

## Testing

After setting up cookies, test with:
```bash
cd backend
python test_youtube.py
```

Or create a YouTube sound through the UI and check if it downloads successfully.
