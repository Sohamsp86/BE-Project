import React, { useState, useEffect, useRef } from 'react';
import { Camera, XCircle, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const GetStarted = () => {
  const [prediction, setPrediction] = useState('Initializing...');
  const [isReal, setIsReal] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readyRef = useRef(true); // Lock to prevent spamming

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
          }
        }
      }).catch(err => {
        console.error('Webcam access denied:', err);
        setPrediction('Webcam access denied');
      });

    return () => {
      const tracks = videoRef.current?.srcObject?.getTracks() || [];
      tracks.forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (readyRef.current) {
        processFrame();
        readyRef.current = false; // Lock until next prediction received
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on('prediction', (data) => {
      readyRef.current = true; // Unlock for next frame

      if (typeof data === 'object' && data.error) {
        setPrediction('Error: ' + data.error);
        setIsReal(null);
      } else if (data === 1) {
        setPrediction('Real Face Detected');
        setIsReal(true);
      } else if (data === 2) {
        setPrediction('Spoofed Face Detected');
        setIsReal(false);
      } else {
        setPrediction('Invalid Image');
        setIsReal(null);
      }
    });
  }, []);

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          socket.emit('frame', reader.result); // Send base64 frame
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8); // Reduce size with compression
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 flex items-center justify-center">
          <Camera className="mr-2" /> Face Detection
        </h1>
        <div className="relative mb-4">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            style={{ display: 'none' }}
            width={640}
            height={480}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="border-2 border-gray-300 rounded-lg w-full"
          />
        </div>
        <div className="mt-4 flex items-center justify-center">
          <p className="text-lg font-semibold mr-2">Prediction:</p>
          {prediction && (
            <div className={`flex items-center ${isReal ? 'text-green-600' : isReal === false ? 'text-red-600' : 'text-gray-600'}`}>
              {isReal === true ? <CheckCircle className="mr-2" /> : isReal === false ? <XCircle className="mr-2" /> : null}
              <span>{prediction}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
