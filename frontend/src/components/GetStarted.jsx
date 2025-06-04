import React, { useEffect, useRef, useState } from 'react';
import { Camera, XCircle, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import '../styles/getStarted.css';

const socket = io('http://localhost:5000');

const GetStarted = () => {
  const [prediction, setPrediction] = useState('Initializing...');
  const [isReal, setIsReal] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readyRef = useRef(true);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }).catch((err) => {
        console.error('Webcam error:', err);
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
        readyRef.current = false;
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on('prediction', (data) => {
      readyRef.current = true;
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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => socket.emit('frame', reader.result);
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="get-started-container">
      <div className="get-started-card">
        <h1 className="title">
          <Camera className="icon" /> Face Detection
        </h1>
        <div className="video-wrapper">
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
            className="get-started-canvas"
          />
        </div>
        <div className={`prediction ${isReal === true ? 'real' : isReal === false ? 'fake' : 'unknown'}`}>
          {isReal === true && <CheckCircle className="icon" />}
          {isReal === false && <XCircle className="icon" />}
          <span>{prediction}</span>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
