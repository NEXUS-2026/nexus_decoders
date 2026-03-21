"""
Enhanced test script to find the correct IP webcam stream endpoint
"""
import cv2
import requests
from urllib.parse import urlparse

def test_ip_webcam_endpoints(base_url="http://192.168.1.5:8080"):
    """Test multiple common IP webcam endpoints"""
    
    print(f"Testing IP webcam endpoints at: {base_url}")
    
    # Common IP webcam endpoints to try
    endpoints = [
        "/",  # Root
        "/video",  # Common video endpoint
        "/stream",  # Another common endpoint
        "/mjpg/video.mjpg",  # MJPEG stream
        "/cam",  # Some cameras use /cam
        "/live",  # Some cameras use /live
        "/api/video",  # API endpoint
        "/video_feed",  # Another variant
        "/snapshot",  # Some cameras use snapshot
        "/cgi-bin/video.cgi",  # CGI script
        "/axis-cgi/mjpg/video.cgi",  # Axis cameras
    ]
    
    # Test each endpoint
    working_endpoints = []
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\n=== Testing: {url} ===")
        
        try:
            response = requests.get(url, timeout=3)
            print(f"✓ Status: {response.status_code}")
            print(f"✓ Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
            
            content_type = response.headers.get('Content-Type', '').lower()
            
            if 'multipart' in content_type or 'mjpg' in content_type or 'video' in content_type:
                print("🎥 This looks like a video stream!")
                working_endpoints.append((url, content_type))
            elif 'image' in content_type:
                print("📷 This looks like a still image endpoint")
            elif 'html' in content_type:
                print("🌐 This is a web page")
            
        except requests.exceptions.Timeout:
            print("⏰ Timeout")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    # Test OpenCV with working endpoints
    print(f"\n=== Testing OpenCV with promising endpoints ===")
    
    for url, content_type in working_endpoints:
        print(f"\nTesting OpenCV with: {url}")
        try:
            cap = cv2.VideoCapture(url)
            print(f"Backend: {cap.getBackendName()}")
            print(f"Opened: {cap.isOpened()}")
            
            if cap.isOpened():
                # Try to read a few frames
                success_count = 0
                for i in range(5):
                    ret, frame = cap.read()
                    if ret:
                        success_count += 1
                        print(f"✓ Frame {i+1}: {frame.shape}")
                    else:
                        print(f"✗ Frame {i+1}: Failed")
                
                if success_count > 0:
                    cv2.imwrite(f"test_frame_{url.split('/')[-1] or 'root'}.jpg", frame)
                    print(f"🎯 SUCCESS: Saved test frame")
                    return url  # Return the first working endpoint
                
            cap.release()
            
        except Exception as e:
            print(f"✗ OpenCV error: {e}")
    
    print("\n❌ No working video stream found")
    return None

if __name__ == "__main__":
    result = test_ip_webcam_endpoints()
    if result:
        print(f"\n🎉 Use this URL in your application: {result}")
    else:
        print("\n💡 Try checking your IP webcam's documentation for the correct stream URL")
