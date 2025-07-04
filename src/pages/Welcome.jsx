import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase.ts';
import { ref, get } from 'firebase/database';

const Welcome = () => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('Position your face in front of the camera');
  const detectionInterval = useRef(null);
  const canvasRef = useRef(null);

  // Load models and start camera
  useEffect(() => {
    let isMounted = true;
    const videoElement = videoRef.current;

    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
        return true;
      } catch (error) {
        console.error("Model loading error:", error);
        setStatus("Error loading face detection models");
        return false;
      }
    };

    const startVideo = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: cameraFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });

        if (isMounted && videoElement) {
          videoElement.srcObject = mediaStream;
          setStream(mediaStream);
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            videoElement.onloadedmetadata = resolve;
          });
          
          return true;
        }
      } catch (error) {
        console.error("Camera access error:", error);
        setStatus("Camera access error - trying fallback");
        
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (isMounted && videoElement) {
            videoElement.srcObject = fallbackStream;
            setStream(fallbackStream);
            return true;
          }
        } catch (fallbackError) {
          console.error("Fallback camera error:", fallbackError);
          setStatus("Could not access camera");
          return false;
        }
      }
      return false;
    };

    const initialize = async () => {
      const modelsLoaded = await loadModels();
      if (!modelsLoaded) return;
      
      const videoStarted = await startVideo();
      if (videoStarted) {
        startFaceDetection();
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [cameraFacingMode]);



const startFaceDetection = () => {
  detectionInterval.current = setInterval(async () => {
    if (isScanning || !videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Get dimensions
      // const videoWidth = video.videoWidth;
      // const videoHeight = video.videoHeight;
      const displayWidth = video.offsetWidth;
      const displayHeight = video.offsetHeight;

      // Set canvas dimensions
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      const displaySize = { width: displayWidth, height: displayHeight };

      if (video.readyState !== 4) return;

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections) {
        // Resize detections
        const resizedDetections = faceapi.resizeResults(detections, {
          width: displayWidth,
          height: displayHeight
        });

        // Check face position and size first
        const isFaceCentered = checkFacePosition(resizedDetections, displaySize);
        const isFaceLargeEnough = checkFaceSize(resizedDetections, displaySize);

        // Draw detections with appropriate color
        faceapi.draw.drawDetections(canvas, resizedDetections, {
          withScore: false,
          lineWidth: 2,
          color: isFaceCentered && isFaceLargeEnough ? '#00FF00' : '#FF0000'
        });

        if (isFaceCentered && isFaceLargeEnough) {
          setStatus("Face detected - scanning...");
          await processFaceDetection();
        } else if (!isFaceLargeEnough) {
          setStatus("Move closer - face too small");
        } else {
          setStatus("Please center your face in the frame");
        }
      } else {
        setStatus("Position your face in front of the camera");
      }
    } catch (error) {
      console.error("Detection error:", error);
      setStatus("Detection error - retrying");
    }
  }, 1000); 
};

// Helper function to check face position
const checkFacePosition = (detection, displaySize) => {
  if (!detection?.detection?.box) return false;

  const box = detection.detection.box;
  
  // Define central area (adjust these as needed)
  const centerThresholdX = 0.20; // 20% from center horizontally
  const centerThresholdY = 0.1; // 10% from center vertically
  
  const minX = displaySize.width * (0.5 - centerThresholdX);
  const maxX = displaySize.width * (0.5 + centerThresholdX);
  const minY = displaySize.height * (0.5 - centerThresholdY);
  const maxY = displaySize.height * (0.5 + centerThresholdY);

  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  return (
    faceCenterX > minX &&
    faceCenterX < maxX &&
    faceCenterY > minY &&
    faceCenterY < maxY
  );
};

// Helper function to check face size
const checkFaceSize = (detection, displaySize) => {
  if (!detection?.detection?.box) return false;
  
  const box = detection.detection.box;
  // Face should be at least 25% of the screen height
  return box.height > displaySize.height * 0.25;
};

  
  const processFaceDetection = async () => {
    if (!videoRef.current || isScanning) return;
    setIsScanning(true);

    try {
      const video = videoRef.current;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("Face not clear - please try again");
        return;
      }

      const clientsRef = ref(db, "clients/");
      const snapshot = await get(clientsRef);
      
      if (!snapshot.exists()) {
        navigate('/register');
        return;
      }

      const data = snapshot.val();
      const labeledDescriptors = Object.entries(data).map(([id, client]) => {
        return new faceapi.LabeledFaceDescriptors(id, [new Float32Array(client.descriptor)]);
      });

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

      if (bestMatch.label !== 'unknown') {
        navigate('/appointment', { 
          state: { 
            userId: bestMatch.label,
            userName: data[bestMatch.label]?.name || 'User'
          } 
        });
      } else {
        navigate('/register');
      }
    } catch (error) {
      console.error("Processing error:", error);
      setStatus("Error processing face - please try again");
    } finally {
      setIsScanning(false);
    }
  };

  const toggleCamera = () => {
    setCameraFacingMode(prevMode => 
      prevMode === 'environment' ? 'user' : 'environment'
    );
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-100 p-4'>
      <h1 className='text-2xl font-bold mb-4'>Welcome to Cloud Syntex</h1>
      <p className='text-gray-600 mb-6'>{status}</p>
      
      <div className="relative w-full max-w-[800px] h-[600px] mx-auto">

        {/* video view */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover rounded-lg" 
            style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* canves layer */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}  
          />

          {/* Add center guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Outer circle */}
              <div className="border-2 border-dashed border-white rounded-[50%/40%_40%_60%_60%] w-60 h-80 opacity-50"></div>
              
              {/* Center crosshair */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white opacity-70 transform -translate-y-1/2"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white opacity-70 transform -translate-x-1/2"></div>
              
              {/* Text hint */}
              {/* <div className="absolute top-full mt-2 w-full text-center text-white text-sm">
                Center your face here
              </div> */}
            </div>
          </div>

        {/* camera switch button */}
        <button
          onClick={toggleCamera}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full"
          aria-label="Switch camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <div className="animate-pulse text-white text-lg">Scanning...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;