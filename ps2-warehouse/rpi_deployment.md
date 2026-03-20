# Raspberry Pi Deployment Guide

## Hardware
- Raspberry Pi 4 (4GB+ recommended)
- MicroSD card 32GB+
- USB Camera or Pi Camera Module

## OS Setup
Flash Raspberry Pi OS (64-bit Lite) to SD card.
Enable SSH. Connect to same LAN as your device.

## Install dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git ffmpeg -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Clone repo

```bash
git clone https://github.com/YOUR_REPO ps2-warehouse
cd ps2-warehouse
```

## Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Frontend build (run once)

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}'):8000 npm run build
npm run start -- -p 3001
# OR export as static: npm run export → serves from FastAPI
```

## Detection engine

```bash
cd detection_engine
source ../backend/venv/bin/activate
pip install -r requirements.txt
python engine.py --source 0 --session SESSION_ID --model /path/to/box_detection.pt
```

## Access from phone
Open browser → `http://RASPBERRY_PI_IP:3000`
