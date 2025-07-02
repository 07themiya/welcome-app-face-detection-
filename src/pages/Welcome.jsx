import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase.ts';
import { ref, get } from 'firebase/database';

const Welcome = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          videoRef.current.srcObject = stream;
        });
    };

    loadModels().then(startVideo);
  }, []);

const handleScan = async () => {
  setIsScanning(true);
  try {
    const detections = await faceapi.detectSingleFace(
      videoRef.current, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
      alert("No face detected");
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
    const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

    if (bestMatch.label !== 'unknown') {
      // Pass the user ID (bestMatch.label) to the appointment page
      navigate('/appointment', { 
        state: { 
          userId: bestMatch.label,
          // You can also pass additional user data if needed
          userName: data[bestMatch.label]?.name || 'User'
        } 
      });
    } else {
      navigate('/register');
    }
  } catch (error) {
    console.error("Scanning error:", error);
    alert(`Error during face scan: ${error.message}`);
  } finally {
    setIsScanning(false);
  }
};

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-100'>
        <h1 className='text-2xl font-bold mb-4'>Welcome to Cloud Syntex</h1>
        <p className='text-gray-600 mb-6'>Please scan your face to proceed</p>
      <video ref={videoRef} autoPlay muted width="500" height="500" className='border-2 border-gray-300 rounded-lg items-center justify-center'/>
        <button className='bg-blue-500 text-white px-4 py-2 rounded mt-3' onClick={handleScan} disabled={isScanning}>
            {isScanning ? 'Scanning...' : 'Scan Face'}
        </button>
    </div>
  );
};

export default Welcome;
