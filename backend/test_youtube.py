#!/usr/bin/env python3
"""
Test script to verify YouTube ingestion works.
Run this from the backend directory with the virtual environment activated.
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.youtube import youtube_service
from app.services.storage import storage_service

async def test_youtube_download():
    """Test downloading a short YouTube video"""
    # Use a short test video (10 second video)
    test_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # "Me at the zoo" - first YouTube video, very short
    test_sound_id = "test-youtube-001"
    
    print(f"Testing YouTube download...")
    print(f"URL: {test_url}")
    print(f"Sound ID: {test_sound_id}")
    
    try:
        # Clean up any existing test file
        test_path = storage_service.get_audio_path(test_sound_id, "mp3")
        if test_path.exists():
            print(f"Removing existing test file: {test_path}")
            test_path.unlink()
        
        # Test download
        result_path = await youtube_service.download_audio(test_url, test_sound_id)
        
        print(f"✅ Success! Downloaded to: {result_path}")
        
        # Verify file exists
        if Path(result_path).exists():
            file_size = Path(result_path).stat().st_size
            print(f"✅ File exists, size: {file_size} bytes")
            return True
        else:
            print(f"❌ File not found at: {result_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_youtube_download())
    sys.exit(0 if success else 1)
