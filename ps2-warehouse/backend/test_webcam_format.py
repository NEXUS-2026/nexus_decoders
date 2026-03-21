"""
Quick test to check what your IP webcam actually serves
"""
import cv2
import requests

def test_webcam_format(url="http://192.168.1.5:8080"):
    print(f"Testing webcam format at: {url}")
    
    # Test 1: Check what the base URL serves
    try:
        response = requests.get(url, timeout=5)
        print(f"Base URL Response: {response.status_code}")
        print(f"Base URL Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
        print(f"Base URL Content-Length: {len(response.content)} bytes")
    except Exception as e:
        print(f"Base URL Error: {e}")
    
    # Test 2: Try /video endpoint
    video_url = f"{url}/video"
    try:
        response = requests.get(video_url, timeout=5)
        print(f"Video URL Response: {response.status_code}")
        print(f"Video URL Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
        print(f"Video URL Content-Length: {len(response.content)} bytes")
    except Exception as e:
        print(f"Video URL Error: {e}")
    
    # Test 3: Try OpenCV with different approaches
    print("\n=== OpenCV Tests ===")
    
    # Test direct URL
    print("Testing direct URL with OpenCV...")
    cap1 = cv2.VideoCapture(url)
    print(f"Direct URL - Opened: {cap1.isOpened()}, Backend: {cap1.getBackendName()}")
    if cap1.isOpened():
        ret, frame = cap1.read()
        print(f"Direct URL - Frame read: {ret}, Shape: {frame.shape if ret else 'None'}")
    cap1.release()
    
    # Test /video endpoint
    print("Testing /video endpoint with OpenCV...")
    cap2 = cv2.VideoCapture(video_url)
    print(f"Video URL - Opened: {cap2.isOpened()}, Backend: {cap2.getBackendName()}")
    if cap2.isOpened():
        ret, frame = cap2.read()
        print(f"Video URL - Frame read: {ret}, Shape: {frame.shape if ret else 'None'}")
    cap2.release()
    
    # Test with different backends
    print("Testing with different backends...")
    backends = [cv2.CAP_FFMPEG, cv2.CAP_DSHOW]
    for backend in backends:
        cap = cv2.VideoCapture(video_url, backend)
        print(f"Backend {backend} - Opened: {cap.isOpened()}")
        if cap.isOpened():
            ret, frame = cap.read()
            print(f"Backend {backend} - Frame: {ret}")
        cap.release()

if __name__ == "__main__":
    test_webcam_format()
