# Driver Drowsiness Detection

This project implements a real-time driver drowsiness detection system with a web-based dashboard interface. It uses deep learning (CNN) and MediaPipe to detect driver drowsiness by monitoring eye states and provides real-time alerts through a sophisticated web interface.

## 🚀 Features

- Real-time drowsiness detection through webcam
- Web-based dashboard interface
- Live status monitoring and analytics
- Session recording and playback
- Configurable alert thresholds
- Dark/Light mode support
- Real-time data visualization
- System logs and alerts history

## 🧠 Tech Stack

### Backend
- **Language**: Python
- **Web Framework**: Flask
- **ML/CV Libraries**:
  - TensorFlow / Keras
  - MediaPipe
  - OpenCV
  - NumPy

### Frontend
- **HTML5/CSS3/JavaScript**
- **Libraries**:
  - Chart.js (for real-time graphs)
  - MaterialDesignIcons
  - TailwindCSS

### ML Model
- CNN for eye state classification
- MediaPipe Face Mesh for facial landmark detection
- Real-time video processing pipeline

## 📁 Project Structure

```bash
driver-drowsiness-detection/
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── alert-system.js
│   │   ├── ui-controls.js
│   │   └── user-settings.js
│   ├── audio/
│   │   └── alert.mp3
│   └── img/
│       └── alert-icon.png
├── templates/
│   └── index.html
├── model/
│   └── drowsiness_model.h5
├── sessions/
│   └── [session recordings]
├── data/
│   └── profiles.json
├── dataset/
│   ├── train/
│   │   ├── Open/
│   │   └── Closed/
│   └── test/
│       ├── Open/
│       └── Closed/
├── notebooks/
│   └── train_model.ipynb
├── utils/
│   └── [utility scripts]
├── split_dataset.py
├── app.py
├── main.py
├── requirements.txt
└── README.md
```

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SUY18ASH/driver-drowsiness-detection.git
cd driver-drowsiness-detection
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## 💾 Model Output

- The trained model will be saved to:

```bash
model/drowsiness_model.keras
```

## 💡 Features Detail

### Real-time Detection
- Detects closed or open eyes using a CNN model
- Uses MediaPipe's Face Mesh for eye tracking
- Plays an alert sound if drowsiness is detected
- Live webcam feed processing
- Drowsiness level calculation
- Configurable detection thresholds

### Dashboard Interface
- Real-time status monitoring
- Dynamic charts and statistics
- System logs display
- Session recording and playback
- Dark/Light mode toggle

### Alert System
- Configurable alert thresholds
- Visual and audio alerts
- Browser notifications
- Alert history logging

### Session Management
- Session recording
- Playback functionality
- Session statistics
- Data export capability

## ⚙️ Configuration

### Detection Settings
- Drowsiness threshold adjustment
- Frame check threshold configuration
- Alert sensitivity settings

### Alert Settings
- Sound alerts toggle
- Volume control
- Browser notifications
- Alert thresholds (Low, Medium, High)

## 🔒 Security and Privacy

- Local session storage
- No cloud dependencies
- Configurable data retention
- Private user profiles

## 🔮 Future Enhancements

- Multiple camera support
- Advanced analytics dashboard
- Mobile app integration
- Cloud backup option
- AI-powered alert optimization
- Remote monitoring capabilities

## 👤 Authors

- Suyash Chouksey
- Srajan Soni

## 📜 License

This project is open-source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

For questions or support, please open an issue in the repository.

## 🔖 Hashtags (for GitHub ReadMe SEO)

```
#drowsiness-detection #machinelearning #deep-learning #flask #opencv #mediapipe #realtimesystems #computervision #driver-safety #cnnmodel #pythonprojects #webdashboard #aiprojects #tensorflow #keras
```

