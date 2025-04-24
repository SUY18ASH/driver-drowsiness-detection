# app.py
from flask import Flask, render_template, Response, jsonify
import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
import os
import threading
import time
import base64
from datetime import datetime
import json
from flask import request
from pathlib import Path

app = Flask(__name__)

# Global variables
model = None
SESSIONS_DIR = 'sessions'
current_session = None
cap = None
is_running = False
detection_thread = None
frame_check_threshold = 20
closed_frames = 0
alarm_on = False
current_frame = None
detection_status = {
    "face_detected": False,
    "eyes_closed": 0,
    "drowsiness_level": 0,
    "alert_active": False,
    "last_update": "",
}
logs = []
PROFILES_FILE = Path('data/profiles.json')

PROFILES_FILE.parent.mkdir(exist_ok=True)

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Eye landmark indices for MediaPipe
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

# Settings
IMG_SIZE = (64, 64)

class Session:
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.session_id = self.start_time.strftime('%Y%m%d_%H%M%S')
        self.data = []
        self.is_recording = True
        
    def add_frame_data(self, data):
        if self.is_recording:
            frame_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'face_detected': data['face_detected'],
                'eyes_closed': data['eyes_closed'],
                'drowsiness_level': data['drowsiness_level'],
                'alert_active': data['alert_active']
            }
            self.data.append(frame_data)
    
    def stop(self):
        self.is_recording = False
        self.save()
    
    def save(self):
        if not os.path.exists(SESSIONS_DIR):
            os.makedirs(SESSIONS_DIR)
        
        filepath = os.path.join(SESSIONS_DIR, f'session_{self.session_id}.json')
        with open(filepath, 'w') as f:
            json.dump({
                'session_id': self.session_id,
                'start_time': self.start_time.isoformat(),
                'frames': self.data
            }, f)


def load_detection_model():
    global model
    
    # Check if model file exists and try different extensions
    model_paths = ['model/drowsiness_model.keras', 'model/drowsiness_model.h5']
    model_path = None

    for path in model_paths:
        if os.path.exists(path):
            model_path = path
            break

    if model_path is None:
        add_to_log("ERROR: Model file not found!")
        return False

    try:
        add_to_log(f"Loading model from: {model_path}")
        model = load_model(model_path)
        add_to_log("Model loaded successfully!")
        return True
    except Exception as e:
        add_to_log(f"Error loading model: {str(e)}")
        return False

def add_to_log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logs.append({"timestamp": timestamp, "message": message})
    
    # Keep only the last 100 log entries
    if len(logs) > 100:
        logs.pop(0)
    
    print(f"[{timestamp}] {message}")

def process_frame():
    global current_frame, closed_frames, alarm_on, detection_status
    
    if cap is None or not cap.isOpened():
        return
        
    ret, frame = cap.read()
    if not ret:
        add_to_log("Failed to grab frame from webcam")
        return
        
    # Create a copy for display
    display_frame = frame.copy()
    h, w, _ = frame.shape
    
    # Process with MediaPipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)
    
    # Update face detection status
    face_detected = results.multi_face_landmarks is not None
    detection_status["face_detected"] = face_detected
    detection_status["last_update"] = datetime.now().strftime("%H:%M:%S")
    
    if face_detected:
        eyes_closed = 0
        
        for face_landmarks in results.multi_face_landmarks:
            # Process each eye
            for eye_idx, eye_indices in enumerate([LEFT_EYE, RIGHT_EYE]):
                eye_name = "Left Eye" if eye_idx == 0 else "Right Eye"
                
                # Get coordinates
                x_coords = [int(face_landmarks.landmark[i].x * w) for i in eye_indices]
                y_coords = [int(face_landmarks.landmark[i].y * h) for i in eye_indices]
                x_min, x_max = min(x_coords), max(x_coords)
                y_min, y_max = min(y_coords), max(y_coords)
                
                # Add padding
                padding = 5
                x_min = max(0, x_min - padding)
                y_min = max(0, y_min - padding)
                x_max = min(w, x_max + padding)
                y_max = min(h, y_max + padding)
                
                # Extract eye region
                eye_img = frame[y_min:y_max, x_min:x_max]
                if eye_img.size == 0 or eye_img.shape[0] == 0 or eye_img.shape[1] == 0:
                    continue
                    
                try:
                    # Resize and prepare for model
                    eye_img = cv2.resize(eye_img, IMG_SIZE)
                    eye_input = eye_img / 255.0
                    eye_input = np.expand_dims(eye_input, axis=0)
                    
                    # Predict
                    prediction = model.predict(eye_input, verbose=0)
                    label = "Closed" if prediction < 0.5 else "Open"
                    
                    if label == "Closed":
                        eyes_closed += 1
                        
                    # Draw eye box and label
                    color = (0, 0, 255) if label == "Closed" else (0, 255, 0)
                    cv2.rectangle(display_frame, (x_min, y_min), (x_max, y_max), color, 2)
                    cv2.putText(display_frame, f"{eye_name}: {label}", 
                               (x_min, y_min - 5), cv2.FONT_HERSHEY_SIMPLEX, 
                               0.6, color, 2)
                               
                except Exception as e:
                    add_to_log(f"Error processing eye: {str(e)}")
                    continue
        
        # Update eye state
        detection_status["eyes_closed"] = eyes_closed
        
        if eyes_closed == 2:
            closed_frames += 1
        else:
            closed_frames = 0
            
        # Update drowsiness level
        drowsiness_level = min(100, int((closed_frames / frame_check_threshold) * 100))
        detection_status["drowsiness_level"] = drowsiness_level
        
        # Display counter for closed frames
        cv2.putText(display_frame, f"Closed frames: {closed_frames}/{frame_check_threshold}", 
                  (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                  
        # Check for drowsiness alert
        if closed_frames >= frame_check_threshold:
            # Display alert
            cv2.putText(display_frame, "DROWSINESS DETECTED!", 
                      (int(w/2) - 160, 50), cv2.FONT_HERSHEY_SIMPLEX, 
                      1.0, (0, 0, 255), 3)
                      
            # Add a red overlay
            overlay = display_frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 255), -1)
            cv2.addWeighted(overlay, 0.2, display_frame, 0.8, 0, display_frame)
            
            detection_status["alert_active"] = True
            
            # Log alert if not already alarming
            if not alarm_on:
                alarm_on = True
                add_to_log("ALERT: Drowsiness detected!")
        else:
            alarm_on = False
            detection_status["alert_active"] = False
    else:
        # No face detected
        detection_status["eyes_closed"] = 0
        detection_status["drowsiness_level"] = 0
        detection_status["alert_active"] = False
        
        # Reset counters
        closed_frames = 0
        alarm_on = False
        
        # Add text to display frame
        cv2.putText(display_frame, "No Face Detected", 
                  (int(w/2) - 100, int(h/2)), 
                  cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    
    # Encode the frame as JPEG
    _, buffer = cv2.imencode('.jpg', display_frame)
    current_frame = buffer.tobytes()

def generate_frames():
    while is_running:
        if current_frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + current_frame + b'\r\n')
        time.sleep(0.03)  # ~30 FPS

def run_detection_thread():
    global is_running, cap, closed_frames
    
    add_to_log("Detection thread started")
    closed_frames = 0
    
    while is_running:
        process_frame()
        time.sleep(0.03)  # ~30 FPS
    
    add_to_log("Detection thread stopped")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_detection')
def start_detection():
    global is_running, cap, detection_thread, current_session
    
    app.logger.info("Start detection endpoint called")  # Debug log
    
    if is_running:
        app.logger.info("Detection already running")  # Debug log
        return jsonify({"status": "already_running"})
    
    try:
        # Load model if not loaded
        if model is None:
            if not load_detection_model():
                app.logger.error("Failed to load model")  # Debug log
                return jsonify({"status": "error", "message": "Failed to load model"})
        
        # Initialize video capture
        if cap is None:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                app.logger.error("Could not open webcam")  # Debug log
                return jsonify({"status": "error", "message": "Could not open webcam"})
        
        is_running = True
        current_session = Session()
        
        # Start detection thread
        detection_thread = threading.Thread(target=run_detection_thread)
        detection_thread.daemon = True
        detection_thread.start()
        
        app.logger.info("Detection started successfully")  # Debug log
        return jsonify({"status": "started", "session_id": current_session.session_id})
    
    except Exception as e:
        app.logger.error(f"Error starting detection: {str(e)}")  # Debug log
        return jsonify({"status": "error", "message": str(e)})

@app.route('/stop_detection')
def stop_detection():
    global is_running, cap, current_session
    
    app.logger.info("Stop detection endpoint called")  # Debug log
    
    if not is_running:
        app.logger.info("Detection not running")  # Debug log
        return jsonify({"status": "not_running"})
    
    try:
        is_running = False
        
        # Stop and save the current session
        if current_session:
            current_session.stop()
        
        # Wait for thread to finish
        if detection_thread is not None and detection_thread.is_alive():
            detection_thread.join(timeout=1.0)
        
        # Release camera
        if cap is not None:
            cap.release()
            cap = None
        
        app.logger.info("Detection stopped successfully")  # Debug log
        return jsonify({"status": "stopped"})
    
    except Exception as e:
        app.logger.error(f"Error stopping detection: {str(e)}")  # Debug log
        return jsonify({"status": "error", "message": str(e)})
    
    
@app.route('/sessions')
def list_sessions():
    if not os.path.exists(SESSIONS_DIR):
        return jsonify([])
    
    sessions = []
    for filename in os.listdir(SESSIONS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(SESSIONS_DIR, filename)
            with open(filepath, 'r') as f:
                session_data = json.load(f)
                sessions.append({
                    'session_id': session_data['session_id'],
                    'start_time': session_data['start_time'],
                    'frame_count': len(session_data['frames'])
                })
    
    return jsonify(sorted(sessions, key=lambda x: x['start_time'], reverse=True))

@app.route('/sessions/<session_id>')
def get_session(session_id):
    filepath = os.path.join(SESSIONS_DIR, f'session_{session_id}.json')
    if not os.path.exists(filepath):
        return jsonify({"error": "Session not found"}), 404
    
    with open(filepath, 'r') as f:
        return jsonify(json.load(f))
    
@app.route('/status')
def get_status():
    return jsonify(detection_status)

@app.route('/logs')
def get_logs():
    return jsonify(logs)

@app.route('/set_threshold/<int:threshold>')
def set_threshold(threshold):
    global frame_check_threshold
    
    if threshold < 5:
        threshold = 5
    elif threshold > 50:
        threshold = 50
    
    frame_check_threshold = threshold
    add_to_log(f"Drowsiness threshold set to {threshold}")
    return jsonify({"status": "success", "threshold": threshold})

@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    try:
        if PROFILES_FILE.exists():
            with open(PROFILES_FILE, 'r') as f:
                return jsonify(json.load(f))
        return jsonify({})
    except Exception as e:
        app.logger.error(f"Error loading profiles: {str(e)}")
        return jsonify({"error": "Failed to load profiles"}), 500

@app.route('/api/profiles', methods=['POST'])
def save_profiles():
    try:
        profiles = request.json
        with open(PROFILES_FILE, 'w') as f:
            json.dump(profiles, f, indent=2)
        return jsonify({"status": "success"})
    except Exception as e:
        app.logger.error(f"Error saving profiles: {str(e)}")
        return jsonify({"error": "Failed to save profiles"}), 500

if __name__ == '__main__':
    # Make sure model directory exists
    os.makedirs('model', exist_ok=True)
    
    # Load the model on startup
    load_detection_model()
    
    # Run the application
    app.run(debug=True, threaded=True)