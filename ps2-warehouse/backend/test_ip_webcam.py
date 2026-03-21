"""
Simple test script to check IP webcam connectivity
"""
import cv2
import requests
from urllib.parse import urlparse

def test_ip_webcam(url="http://192.168.1.5:8080"):
    """Test IP webcam connection with different approaches"""
    
    print(f"Testing IP webcam at: {url}")
    
    # Test 1: Direct HTTP request
    print("\n=== Test 1: HTTP Request ===")
    try:
        response = requests.get(url, timeout=5)
        print(f"✓ HTTP Response: {response.status_code}")
        print(f"✓ Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
        print(f"✓ Content-Length: {response.headers.get('Content-Length', 'Unknown')}")
    except Exception as e:
        print(f"✗ HTTP Request failed: {e}")
    
    # Test 2: Try /video endpoint
    video_url = f"{url}/video" if not url.endswith('/video') else url
    print(f"\n=== Test 2: /video endpoint ===")
    print(f"Trying: {video_url}")
    try:
        response = requests.get(video_url, timeout=5)
        print(f"✓ Video Response: {response.status_code}")
        print(f"✓ Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
    except Exception as e:
        print(f"✗ Video endpoint failed: {e}")
    
    # Test 3: OpenCV direct connection
    print(f"\n=== Test 3: OpenCV Connection ===")
    try:
        cap = cv2.VideoCapture(url)
        print(f"✓ VideoCapture backend: {cap.getBackendName()}")
        print(f"✓ Is opened: {cap.isOpened()}")
        
        if cap.isOpened():
            # Try to read a frame
            ret, frame = cap.read()
            if ret:
                print(f"✓ Frame read successfully: {frame.shape}")
                # Save test frame
                cv2.imwrite("test_frame.jpg", frame)
                print("✓ Test frame saved as 'test_frame.jpg'")
            else:
                print("✗ Failed to read frame")
        
        cap.release()
    except Exception as e:
        print(f"✗ OpenCV failed: {e}")
    
    # Test 4: OpenCV with /video endpoint
    print(f"\n=== Test 4: OpenCV with /video ===")
    try:
        cap = cv2.VideoCapture(video_url)
        print(f"✓ VideoCapture backend: {cap.getBackendName()}")
        print(f"✓ Is opened: {cap.isOpened()}")
        
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(f"✓ Frame read successfully: {frame.shape}")
                cv2.imwrite("test_frame_video.jpg", frame)
                print("✓ Test frame saved as 'test_frame_video.jpg'")
            else:
                print("✗ Failed to read frame")
        
        cap.release()
    except Exception as e:
        print(f"✗ OpenCV with /video failed: {e}")

if __name__ == "__main__":
    test_ip_webcam()
