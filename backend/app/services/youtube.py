import subprocess
import asyncio
import json
import re
from pathlib import Path
from typing import Optional, Dict
from app.config import settings
from app.services.storage import storage_service
import logging

logger = logging.getLogger(__name__)


class YouTubeService:
    def __init__(self):
        self.ytdlp_path = settings.YTDLP_PATH
        self._check_ytdlp_version()
    
    def _check_ytdlp_version(self):
        """Check yt-dlp version and warn if outdated"""
        try:
            result = subprocess.run(
                [self.ytdlp_path, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                try:
                    year, month, day = map(int, version.split('.'))
                    if year < 2024 or (year == 2024 and month < 10):
                        logger.warning(
                            f"yt-dlp version {version} is outdated (recommended: >= 2024.10.0). "
                            f"YouTube downloads may fail. Update with: pip install -U yt-dlp"
                        )
                except:
                    pass
        except Exception:
            pass
    
    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def _clean_youtube_url(self, url: str) -> str:
        """Clean YouTube URL to remove playlist parameters and normalize"""
        video_id = self._extract_video_id(url)
        if video_id:
            # Reconstruct clean URL with just the video ID
            return f"https://www.youtube.com/watch?v={video_id}"
        return url
    
    def _build_canonical_command(
        self, 
        youtube_url: str, 
        output_path: Path, 
        output_format: str = "mp3",
        get_metadata: bool = False,
        verbose: bool = False,
        use_cookies: bool = False
    ) -> list:
        """
        Build canonical yt-dlp command following best practices.
        
        Principles:
        - Explicit format selection (bestaudio/best)
        - Deterministic output path
        - JSON metadata extraction
        - Network robustness with retry + throttling
        - Cookie support (browser or file)
        - No extractor-args (unstable)
        """
        # Use video ID for deterministic filename
        video_id = self._extract_video_id(youtube_url)
        if video_id:
            output_template = str(output_path.parent / f"{video_id}.%(ext)s")
        else:
            # Fallback to sound_id if we can't extract video ID
            output_template = str(output_path.with_suffix("")) + ".%(ext)s"
        
        cmd = [
            self.ytdlp_path,
            "--no-playlist",  # Never download playlists by default
            # Flexible format selection with fallbacks
            # Tries: audio-only formats first, then any format with audio (will extract audio)
            "-f", "bestaudio/best",  # Best audio format, or best format (will extract audio)
            "--extract-audio",  # Extract audio (more explicit than -x)
            "--audio-format", output_format,  # Force MP3
            "--audio-quality", "0",  # Best quality
            "--embed-metadata",  # Embed metadata in file
            "--embed-thumbnail",  # Embed cover art
            "-o", output_template,  # Deterministic output path
            # Enhanced network robustness + throttling (reduces rate limiting)
            "--retries", "10",  # Increased retries
            "--fragment-retries", "10",  # Increased fragment retries
            "--retry-sleep", "1",  # Wait 1 second between retries
            "--sleep-interval", "1",  # Throttle between requests (reduces bans)
            "--max-sleep-interval", "5",  # Max throttle time
            "--socket-timeout", "15",  # Connection timeout
        ]
        
        # Add cookies support (only if explicitly requested - avoid firefox cookies bug)
        # Best practice: try without cookies first, only add on 403 errors
        if use_cookies:
            # Prefer cookies file over browser cookies (more reliable)
            if settings.YTDLP_COOKIES_FILE:
                cookies_path = Path(settings.YTDLP_COOKIES_FILE)
                if cookies_path.exists():
                    cmd.extend(["--cookies", str(cookies_path)])
                    logger.debug("Using cookies file for authentication")
            elif settings.YTDLP_COOKIES_FROM_BROWSER:
                # Prefer chrome over firefox (firefox has known issues)
                browser = settings.YTDLP_COOKIES_FROM_BROWSER.lower()
                if browser == "firefox":
                    logger.warning(
                        "Firefox cookies-from-browser can cause 'format not available' errors. "
                        "Consider using cookies file or chrome instead."
                    )
                cmd.extend(["--cookies-from-browser", settings.YTDLP_COOKIES_FROM_BROWSER])
                logger.debug(f"Using cookies from browser: {settings.YTDLP_COOKIES_FROM_BROWSER}")
        
        # Verbose logging for debugging
        if verbose or settings.YTDLP_VERBOSE:
            cmd.append("-v")  # Verbose mode
        else:
            cmd.append("--no-warnings")  # Suppress warnings in normal mode
        
        # Add JSON output for metadata if requested
        if get_metadata:
            cmd.append("--print-json")
        
        cmd.append(youtube_url)
        
        return cmd
    
    async def get_video_metadata(self, youtube_url: str) -> Dict:
        """
        Get video metadata without downloading (idempotent check).
        Returns dict with id, title, duration, uploader, etc.
        """
        # Canonicalize URL first (same as download)
        video_id = self._extract_video_id(youtube_url)
        if video_id:
            canonical_url = f"https://www.youtube.com/watch?v={video_id}"
        else:
            canonical_url = youtube_url
        
        cmd = [
            self.ytdlp_path,
            "--no-playlist",
            "--dump-json",  # Get JSON without downloading
            "--skip-download",  # Don't download
        ]
        
        # Add cookies if configured (prefer file over browser)
        if settings.YTDLP_COOKIES_FILE:
            cookies_path = Path(settings.YTDLP_COOKIES_FILE)
            if cookies_path.exists():
                cmd.extend(["--cookies", str(cookies_path)])
        elif settings.YTDLP_COOKIES_FROM_BROWSER:
            # Prefer chrome over firefox
            cmd.extend(["--cookies-from-browser", settings.YTDLP_COOKIES_FROM_BROWSER])
        
        cmd.append(canonical_url)
        
        try:
            process = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=30
            )
            
            # Parse JSON from stdout
            info = json.loads(process.stdout.strip())
            return {
                "id": info.get("id"),
                "title": info.get("title"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader"),
                "thumbnail": info.get("thumbnail"),
            }
        except Exception as e:
            logger.error(f"Failed to get video metadata: {e}")
            raise

    async def download_audio(
        self, 
        youtube_url: str, 
        sound_id: str, 
        output_format: str = "mp3"
    ) -> Dict[str, str]:
        """
        Download audio from YouTube URL using yt-dlp (best practices).
        
        Returns dict with:
        - file: path to downloaded file
        - metadata: video metadata (id, title, duration, etc.)
        """
        output_path = storage_service.get_audio_path(sound_id, output_format)
        
        # Idempotency: If file already exists, return it
        if output_path.exists():
            logger.info(f"Audio file already exists for sound {sound_id}, skipping download")
            # Try to get metadata from existing file or return minimal info
            video_id = self._extract_video_id(youtube_url)
            return {
                "file": str(output_path),
                "metadata": {
                    "id": video_id,
                    "title": None,  # Would need to read from file metadata
                }
            }
        
        # Canonicalize URL - extract video ID and rebuild clean URL
        # This fixes issues with playlist/radio URLs (list=RD...&start_radio=1)
        video_id = self._extract_video_id(youtube_url)
        if video_id:
            canonical_url = f"https://www.youtube.com/watch?v={video_id}"
            if canonical_url != youtube_url:
                logger.info(f"Canonicalized YouTube URL: {youtube_url} -> {canonical_url}")
            # Use video ID for filename (more stable than sound_id)
            deterministic_path = storage_service.get_audio_path(video_id, output_format)
        else:
            canonical_url = youtube_url
            logger.warning(f"Could not extract video ID from URL: {youtube_url}")
            # Fallback to sound_id if extraction fails
            deterministic_path = output_path
        
        # Best practice: Try WITHOUT cookies first (cookies-from-browser firefox can cause format errors)
        # Only add cookies if we get 403/age-restricted errors
        use_cookies = False
        
        # Build canonical command (no cookies initially)
        cmd = self._build_canonical_command(
            canonical_url, 
            deterministic_path, 
            output_format,
            get_metadata=True,  # Get JSON metadata
            verbose=settings.YTDLP_VERBOSE,  # Use verbose if enabled
            use_cookies=use_cookies  # Start without cookies
        )
        
        logger.info(f"Downloading audio from YouTube: {canonical_url} (no cookies)")
        logger.info(f"Command: {' '.join(cmd)}")
        
        try:
            # Run yt-dlp in a thread to avoid blocking
            process = await asyncio.to_thread(
                subprocess.run,
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
                timeout=600  # 10 minute timeout (longer for robustness)
            )
            
            # Parse JSON metadata from last line of stdout
            stdout_lines = process.stdout.strip().splitlines()
            if stdout_lines:
                try:
                    # yt-dlp prints JSON on the last line
                    metadata_json = json.loads(stdout_lines[-1])
                    metadata = {
                        "id": metadata_json.get("id"),
                        "title": metadata_json.get("title"),
                        "duration": metadata_json.get("duration"),
                        "uploader": metadata_json.get("uploader"),
                        "thumbnail": metadata_json.get("thumbnail"),
                    }
                except json.JSONDecodeError:
                    logger.warning("Could not parse JSON metadata from yt-dlp output")
                    metadata = {"id": video_id}
            else:
                metadata = {"id": video_id}
            
            # Find the actual downloaded file
            # yt-dlp uses video ID in filename if we extracted it
            actual_path = deterministic_path
            if not actual_path.exists():
                # Try with different extensions
                for ext in [output_format, "m4a", "opus", "webm", "mp3"]:
                    candidate = deterministic_path.with_suffix(f".{ext}")
                    if candidate.exists():
                        actual_path = candidate
                        break
                else:
                    # Fallback: check if file exists with sound_id
                    if output_path.exists():
                        actual_path = output_path
                    else:
                        raise FileNotFoundError(
                            f"Downloaded file not found. Expected at: {deterministic_path}"
                        )
            
            logger.info(f"Successfully downloaded audio for sound {sound_id} to {actual_path}")
            
            return {
                "file": str(actual_path),
                "metadata": metadata
            }
            
        except subprocess.TimeoutExpired:
            logger.error(f"yt-dlp timed out after 10 minutes for {youtube_url}")
            raise RuntimeError(
                "Download timed out. The video may be too long or the connection is slow."
            )
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr or e.stdout or "Unknown error"
            logger.error(f"yt-dlp failed with code {e.returncode}: {error_msg[:500]}")
            
            # Check for common errors and provide actionable solutions
            if "403" in error_msg or "Forbidden" in error_msg:
                # Retry with cookies if we haven't used them yet
                if not use_cookies:
                    logger.info("Got 403 error, retrying with cookies...")
                    try:
                        # Build command with cookies enabled
                        retry_cmd = self._build_canonical_command(
                            canonical_url,
                            deterministic_path,
                            output_format,
                            get_metadata=True,
                            verbose=settings.YTDLP_VERBOSE,
                            use_cookies=True  # Enable cookies for retry
                        )
                        
                        logger.info(f"Retrying with cookies: {' '.join(retry_cmd)}")
                        process = await asyncio.to_thread(
                            subprocess.run,
                            retry_cmd,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            text=True,
                            check=True,
                            timeout=600
                        )
                        
                        # Parse result (same as main download)
                        stdout_lines = process.stdout.strip().splitlines()
                        if stdout_lines:
                            try:
                                metadata_json = json.loads(stdout_lines[-1])
                                metadata = {
                                    "id": metadata_json.get("id"),
                                    "title": metadata_json.get("title"),
                                    "duration": metadata_json.get("duration"),
                                    "uploader": metadata_json.get("uploader"),
                                    "thumbnail": metadata_json.get("thumbnail"),
                                }
                            except json.JSONDecodeError:
                                metadata = {"id": video_id}
                        else:
                            metadata = {"id": video_id}
                        
                        # Find downloaded file
                        actual_path = deterministic_path
                        if not actual_path.exists():
                            for ext in [output_format, "m4a", "opus", "webm", "mp3"]:
                                candidate = deterministic_path.with_suffix(f".{ext}")
                                if candidate.exists():
                                    actual_path = candidate
                                    break
                            else:
                                raise FileNotFoundError(f"Downloaded file not found at {deterministic_path}")
                        
                        logger.info(f"Successfully downloaded with cookies: {actual_path}")
                        return {
                            "file": str(actual_path),
                            "metadata": metadata
                        }
                    except Exception as cookie_error:
                        logger.error(f"Retry with cookies also failed: {cookie_error}")
                        # Fall through to error message below
                
                # Build helpful error message
                solutions = [
                    "1. Update yt-dlp: pip install -U yt-dlp",
                ]
                
                if not settings.YTDLP_COOKIES_FILE and not settings.YTDLP_COOKIES_FROM_BROWSER:
                    solutions.append(
                        "2. Enable cookies (most effective fix):\n"
                        "   Set YTDLP_COOKIES_FILE=/path/to/cookies.txt in .env (preferred)\n"
                        "   OR set YTDLP_COOKIES_FROM_BROWSER=chrome (avoid firefox)"
                    )
                else:
                    solutions.append(
                        "2. Cookies are configured but still failing - try:\n"
                        "   - Updating yt-dlp to latest version\n"
                        "   - Exporting fresh cookies from browser\n"
                        "   - Using cookies file instead of browser cookies"
                    )
                
                solutions.extend([
                    "3. The video may be region/age-restricted",
                    "4. YouTube may be rate-limiting - wait a few minutes",
                    "5. Try a different video URL",
                    "6. Enable verbose logging: YTDLP_VERBOSE=true for detailed error info"
                ])
                
                raise RuntimeError(
                    "YouTube blocked the download (403 Forbidden).\n\n"
                    "SOLUTIONS:\n" + "\n".join(solutions)
                )
            elif "nsig extraction failed" in error_msg:
                raise RuntimeError(
                    "YouTube signature extraction failed.\n\n"
                    "SOLUTION: Update yt-dlp to latest version:\n"
                    "pip install -U yt-dlp\n"
                )
            elif "Requested format is not available" in error_msg or "format is not available" in error_msg:
                # "Format not available" often means:
                # 1. URL has playlist/radio parameters (fixed by canonicalization)
                # 2. cookies-from-browser firefox bug (fixed by trying without cookies first)
                # 3. Video actually has no formats (rare)
                
                logger.info("Format not available - trying without cookies and with auto-format selection...")
                try:
                    # Try WITHOUT cookies first (firefox cookies can cause this error)
                    # Use canonical URL (already cleaned)
                    # Build command with no format restrictions - yt-dlp will auto-select
                    flexible_cmd = [
                        self.ytdlp_path,
                        "--no-playlist",
                        "--extract-audio",  # Extract audio from whatever format is available
                        "--audio-format", output_format,
                        "--audio-quality", "0",
                        "--embed-metadata",
                        "--embed-thumbnail",
                        "-o", str(deterministic_path.parent / f"{video_id or sound_id}.%(ext)s"),
                        "--retries", "10",
                        "--fragment-retries", "10",
                        "--retry-sleep", "1",
                        "--sleep-interval", "1",
                        "--max-sleep-interval", "5",
                        "--socket-timeout", "15",
                    ]
                    
                    # DO NOT add cookies here - this error is often CAUSED by cookies
                    # Only add cookies if we get 403 after this attempt
                    
                    if settings.YTDLP_VERBOSE:
                        flexible_cmd.append("-v")
                    else:
                        flexible_cmd.append("--no-warnings")
                    
                    flexible_cmd.extend(["--print-json", canonical_url])
                    
                    logger.info(f"Retrying with auto-format selection: {' '.join(flexible_cmd)}")
                    process = await asyncio.to_thread(
                        subprocess.run,
                        flexible_cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        check=True,
                        timeout=600
                    )
                    
                    # Parse result (same as main download)
                    stdout_lines = process.stdout.strip().splitlines()
                    if stdout_lines:
                        try:
                            metadata_json = json.loads(stdout_lines[-1])
                            metadata = {
                                "id": metadata_json.get("id"),
                                "title": metadata_json.get("title"),
                                "duration": metadata_json.get("duration"),
                                "uploader": metadata_json.get("uploader"),
                                "thumbnail": metadata_json.get("thumbnail"),
                            }
                        except json.JSONDecodeError:
                            metadata = {"id": video_id}
                    else:
                        metadata = {"id": video_id}
                    
                    # Find downloaded file
                    actual_path = deterministic_path
                    if not actual_path.exists():
                        # Try different extensions
                        for ext in [output_format, "m4a", "opus", "webm", "mp3"]:
                            candidate = deterministic_path.with_suffix(f".{ext}")
                            if candidate.exists():
                                actual_path = candidate
                                break
                        # Try with video_id in filename
                        if not actual_path.exists():
                            for ext in [output_format, "m4a", "opus", "webm", "mp3"]:
                                candidate = deterministic_path.parent / f"{video_id or sound_id}.{ext}"
                                if candidate.exists():
                                    actual_path = candidate
                                    break
                        if not actual_path.exists():
                            raise FileNotFoundError(f"Downloaded file not found at {deterministic_path}")
                    
                    logger.info(f"Successfully downloaded with auto-format selection: {actual_path}")
                    return {
                        "file": str(actual_path),
                        "metadata": metadata
                    }
                except subprocess.CalledProcessError as flexible_error:
                    # Get stderr for better error message
                    error_details = flexible_error.stderr if flexible_error.stderr else str(flexible_error)
                    logger.error(f"Auto-format selection also failed: {error_details[:500]}")
                    
                    # Check if it's a 403 - if so, try with cookies
                    if "403" in error_details or "Forbidden" in error_details:
                        logger.info("Got 403 in fallback, trying with cookies...")
                        try:
                            cookie_cmd = self._build_canonical_command(
                                canonical_url,
                                deterministic_path,
                                output_format,
                                get_metadata=True,
                                verbose=settings.YTDLP_VERBOSE,
                                use_cookies=True
                            )
                            # Remove -f flag if present, use auto-format
                            if "-f" in cookie_cmd:
                                f_idx = cookie_cmd.index("-f")
                                cookie_cmd.pop(f_idx)  # Remove -f
                                cookie_cmd.pop(f_idx)  # Remove format value
                            
                            logger.info(f"Retrying with cookies and auto-format: {' '.join(cookie_cmd)}")
                            process = await asyncio.to_thread(
                                subprocess.run,
                                cookie_cmd,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                text=True,
                                check=True,
                                timeout=600
                            )
                            
                            # Parse and return (same as above)
                            stdout_lines = process.stdout.strip().splitlines()
                            if stdout_lines:
                                try:
                                    metadata_json = json.loads(stdout_lines[-1])
                                    metadata = {
                                        "id": metadata_json.get("id"),
                                        "title": metadata_json.get("title"),
                                        "duration": metadata_json.get("duration"),
                                        "uploader": metadata_json.get("uploader"),
                                        "thumbnail": metadata_json.get("thumbnail"),
                                    }
                                except json.JSONDecodeError:
                                    metadata = {"id": video_id}
                            else:
                                metadata = {"id": video_id}
                            
                            actual_path = deterministic_path
                            if not actual_path.exists():
                                for ext in [output_format, "m4a", "opus", "webm", "mp3"]:
                                    candidate = deterministic_path.with_suffix(f".{ext}")
                                    if candidate.exists():
                                        actual_path = candidate
                                        break
                                if not actual_path.exists():
                                    raise FileNotFoundError(f"Downloaded file not found at {deterministic_path}")
                            
                            logger.info(f"Successfully downloaded with cookies: {actual_path}")
                            return {
                                "file": str(actual_path),
                                "metadata": metadata
                            }
                        except Exception as cookie_retry_error:
                            logger.error(f"Cookie retry also failed: {cookie_retry_error}")
                    
                    raise RuntimeError(
                        f"Could not download this video.\n\n"
                        f"Common causes:\n"
                        f"1. URL had playlist/radio parameters (should be fixed by canonicalization)\n"
                        f"2. cookies-from-browser firefox bug (try cookies file or chrome instead)\n"
                        f"3. Video is private, restricted, or unavailable\n"
                        f"4. Region/age restrictions\n\n"
                        f"Try:\n"
                        f"- Ensure URL is clean (no list=RD...&start_radio=1)\n"
                        f"- Use cookies file instead of browser cookies\n"
                        f"- Update yt-dlp: pip install -U yt-dlp\n"
                        f"- A different video URL\n\n"
                        f"Error: {error_details[:200]}"
                    )
                except Exception as flexible_error:
                    logger.error(f"Auto-format selection failed: {flexible_error}")
                    raise RuntimeError(
                        f"Format not available for this video.\n\n"
                        f"Common causes:\n"
                        f"1. URL had playlist/radio parameters (should be fixed)\n"
                        f"2. cookies-from-browser firefox issue (try cookies file)\n"
                        f"3. Video may not have downloadable formats\n\n"
                        f"Try:\n"
                        f"- Clean URL (remove list/start_radio parameters)\n"
                        f"- Use cookies file instead of browser cookies\n"
                        f"- A different video URL\n\n"
                        f"Error: {error_msg[:200]}"
                    )
            else:
                raise RuntimeError(f"Failed to download audio: {error_msg[:300]}")
        except Exception as e:
            logger.error(f"Error downloading audio: {e}", exc_info=True)
            raise

    def validate_youtube_url(self, url: str) -> bool:
        """Validate that the URL is a YouTube URL"""
        return "youtube.com" in url or "youtu.be" in url


youtube_service = YouTubeService()
