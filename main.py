import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
from playsound import playsound
import threading

# Load the trained model
model = load_model('model/drowsiness_model.keras')

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Eye landmark indices for MediaPipe (left and right eye)
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

# Settings
IMG_SIZE = (64, 64)
frame_check_threshold = 20
closed_frames = 0
alarm_on = False

# Function to play the alarm sound
def play_alarm():
    playsound("utils/alarm.mp3")

# Start video capture
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            h, w, _ = frame.shape
            eyes_closed = 0

            for eye_indices in [LEFT_EYE, RIGHT_EYE]:
                x_coords = [int(face_landmarks.landmark[i].x * w) for i in eye_indices]
                y_coords = [int(face_landmarks.landmark[i].y * h) for i in eye_indices]
                x_min, x_max = min(x_coords), max(x_coords)
                y_min, y_max = min(y_coords), max(y_coords)

                eye_img = frame[y_min:y_max, x_min:x_max]
                if eye_img.size == 0:
                    continue

                eye_img = cv2.resize(eye_img, IMG_SIZE)
                eye_input = eye_img / 255.0
                eye_input = np.expand_dims(eye_input, axis=0)

                prediction = model.predict(eye_input, verbose=0)
                label = "Closed" if prediction < 0.5 else "Open"
                if label == "Closed":
                    eyes_closed += 1

                # Draw eye box and label
                cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (255, 0, 0), 2)
                cv2.putText(frame, label, (x_min, y_min - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                            (0, 0, 255) if label == "Closed" else (0, 255, 0), 2)

            if eyes_closed == 2:
                closed_frames += 1
            else:
                closed_frames = 0

            if closed_frames >= frame_check_threshold:
                cv2.putText(frame, "DROWSINESS DETECTED!", (50, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

                # Trigger alarm if not already playing
                if not alarm_on:
                    alarm_on = True
                    threading.Thread(target=play_alarm).start()
            else:
                alarm_on = False

    cv2.imshow("Drowsiness Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
