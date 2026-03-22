# NEXUS Decoders - PS2 Warehouse Box Counting System

## 🎯 Project Documentation

### 📄 Presentation
- **[AIML_2_DECODERS-2_compressed.pdf](./AIML_2_DECODERS-2_compressed.pdf)**
  - Complete project overview
  - Technical architecture
  - Feature demonstrations
  - Performance metrics

### 🎥 Demo Video
- **[AIML_2_DECODERS.mp4](./AIML_2_DECODERS.mp4)**
  - Live system demonstration
  - Real-time detection showcase
  - User interface walkthrough
  - End-to-end workflow

## 📁 Project Structure

This repository contains the PS2 Warehouse Box Counting System along with its AI model and documentation.

```
nexus_decoders/
├── 🤖 box_detection.pt          # YOLOv8 trained model for box detection
├── 📄 AIML_2_DECODERS-2_compressed.pdf  # Project presentation slides
├── 🎥 AIML_2_DECODERS.mp4       # Project demonstration video
├── 📁 ps2-warehouse/            # Main application code
│   ├── 📁 backend/              # FastAPI backend services
│   ├── 📁 frontend/             # Next.js frontend application
│   ├── 📁 detection_engine/     # Python detection engine
│   └── 📁 storage/              # Database and file storage
└── 📄 README.md                 # This file
```

## 🤖 AI Model Information

### box_detection.pt
- **Model Type**: YOLOv8 (Ultralytics)
- **Purpose**: Real-time box detection in warehouse environments
- **Size**: 14.6 MB (compressed)
- **Classes Trained**: Box, Package, Carton
- **Input Format**: RGB images (640x640 recommended)
- **Accuracy**: >95% precision on standard box sizes

### Model Usage

The `box_detection.pt` model is used by the detection engine in the PS2 system:

```python
# Example usage in detection engine
from ultralytics import YOLO

# Load the model
model = YOLO('box_detection.pt')

# Run detection
results = model('path/to/image.jpg')
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- FFmpeg
- CUDA-compatible GPU (optional, for faster inference)

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/NEXUS-2026/nexus_decoders.git
cd nexus_decoders
```

2. **Backend Setup**
```bash
cd ps2-warehouse/backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

3. **Frontend Setup**
```bash
cd ps2-warehouse/frontend
npm install
npm run dev
# Access at http://localhost:3000
```

4. **Detection Engine**
```bash
cd ps2-warehouse/detection_engine
pip install -r requirements.txt
# Use the provided model
python engine.py --source 0 --session 1 --model ../box_detection.pt
```

## 📊 Model Performance

### Detection Metrics
- **Precision**: 95.2%
- **Recall**: 91.8%
- **mAP@0.5**: 94.1%
- **Inference Speed**: ~30 FPS (RTX 3060)

### Hardware Requirements
- **Minimum**: CPU with 4GB RAM
- **Recommended**: NVIDIA GPU with 6GB+ VRAM
- **Storage**: 500MB free space


## 🔧 Model Configuration

### Detection Parameters
```python
# Default configuration
CONFIDENCE_THRESHOLD = 0.45    # Minimum confidence for detection
IOU_THRESHOLD = 0.5          # Intersection over Union threshold
INPUT_SIZE = 640              # Input image size
MAX_DETECTIONS = 100         # Maximum detections per frame
```

### Supported Classes
- `box` - Standard cardboard boxes
- `package` - Packaged items
- `carton` - Large carton boxes

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Detection       │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│ Engine          │
│                 │    │                 │    │ (Python/YOLO)   │
│ - Web UI        │    │ - REST API      │    │                 │
│ - Analytics     │    │ - Database      │    │ - box_detection │
│ - Session Mgmt  │    │ - File Storage  │    │   .pt model     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📱 Application Features

### Core Functionality
- **Real-time Detection**: Live box counting with video streaming
- **Session Management**: Track operators, batches, and counting sessions
- **Analytics Dashboard**: Visual insights and performance metrics
- **Report Generation**: Automated PDF challans with counting results
- **Email Integration**: Automatic report delivery to stakeholders

### Advanced Features
- **Multiple Input Sources**: Upload, live camera, IP webcam
- **Video Recording**: Compressed videos with detection overlay
- **Data Persistence**: SQLite database for session history
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🔒 Security & Privacy

- **Local Processing**: All data processed locally, no cloud dependency
- **Data Encryption**: Secure storage of sensitive information
- **Access Control**: User authentication and session management
- **Audit Trail**: Complete logging of all system activities

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](ps2-warehouse/LICENSE) file for details.



**NEXUS Decoders** - Revolutionizing warehouse automation with AI-powered counting technology.

For detailed application documentation, please see: [ps2-warehouse/README.md](./ps2-warehouse/README.md)
