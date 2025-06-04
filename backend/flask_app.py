import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO, emit
import numpy as np
import cv2
import base64
from interface import test_frame  # or predict_image if needed


app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('frame')
def handle_frame(data):
    try:
        # Extract base64 image string
        image_data = data.split(',')[1]  # Remove 'data:image/jpeg;base64,'
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        result = test_frame(image)
        emit('prediction', int(result))  # Emit back to frontend

    except Exception as e:
        emit('prediction', {'error': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
