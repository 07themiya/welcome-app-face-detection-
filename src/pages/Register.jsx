// import React, { useEffect, useRef, useState } from 'react';
// import * as faceapi from 'face-api.js';
// import { db } from '../firebase.ts';
// import { ref, set } from 'firebase/database';
// import { useNavigate } from 'react-router-dom';

// const Register = () => {
//   const videoRef = useRef();
//   const [name, setName] = useState('');
//   const [status, setStatus] = useState({ message: '', type: '' });
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     let stream = null;

//     const loadModelsAndStartCamera = async () => {
//       try {
//         setStatus({ message: 'Loading face detection models...', type: 'info' });
        
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector'),
//           faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68'),
//           faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition')
//         ]);
//         setModelsLoaded(true);

//         setStatus({ message: 'Accessing camera...', type: 'info' });
//         stream = await navigator.mediaDevices.getUserMedia({ 
//           video: { 
//             facingMode: "environment",
//             width: { ideal: 640 },
//             height: { ideal: 480 }
//           } 
//         });
        
//         videoRef.current.srcObject = stream;
//         setIsCameraReady(true);
//         setStatus({ message: 'Camera ready. Please position your face in the frame.', type: 'info' });
//       } catch (error) {
//         console.error('Initialization error:', error);
//         setStatus({ 
//           message: `Error: ${error.message}`, 
//           type: 'error' 
//         });
        
//         // Fallback to user-facing camera if environment-facing fails
//         try {
//           stream = await navigator.mediaDevices.getUserMedia({ video: true });
//           videoRef.current.srcObject = stream;
//           setIsCameraReady(true);
//           setStatus({ message: 'Camera ready (using front camera).', type: 'info' });
//         } catch (fallbackError) {
//           setStatus({ 
//             message: 'Could not access any camera. Please check permissions.', 
//             type: 'error' 
//           });
//         }
//       }
//     };

//     loadModelsAndStartCamera();

//     return () => {
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, []);

//   const handleRegister = async () => {
//     if (!name.trim()) {
//       setStatus({ message: 'Please enter your name', type: 'error' });
//       return;
//     }

//     try {
//       setStatus({ message: 'Scanning face...', type: 'info' });
      
//       const detection = await faceapi
//         .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
//         .withFaceLandmarks()
//         .withFaceDescriptor();

//       if (!detection) {
//         setStatus({ message: 'No face detected. Please try again with proper lighting.', type: 'error' });
//         return;
//       }

//       setStatus({ message: 'Processing face data...', type: 'info' });
//       const descriptor = Array.from(detection.descriptor);

//       // Generate a more secure ID
//       const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
//       // Save to Firebase with additional metadata
//       await set(ref(db, `clients/${id}`), {
//         name: name.trim(),
//         descriptor,
//         registeredAt: new Date().toISOString(),
//         lastUpdated: new Date().toISOString()
//       });

//       setStatus({ 
//         message: 'Registration successful! Redirecting...', 
//         type: 'success' 
//       });
      
//       // Stop camera stream before navigating
//       if (videoRef.current.srcObject) {
//         videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//       }
      
//       setTimeout(() => navigate('/'), 2000);
//     } catch (error) {
//       console.error('Registration error:', error);
//       setStatus({ 
//         message: `Registration failed: ${error.message}`, 
//         type: 'error' 
//       });
//     }
//   };

//   return (
//     <div className="p-4 max-w-md mx-auto">
//       <h2 className="text-xl font-bold mb-4 text-center">Register New User</h2>
      
//       <div className="mb-4">
//         <label className="block text-sm font-medium mb-1">Full Name</label>
//         <input
//           type="text"
//           placeholder="Enter your full name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="border p-2 w-full rounded"
//           required
//         />
//       </div>

//       <div className="relative mb-4 bg-gray-200 rounded-lg overflow-hidden">
//         <video 
//           ref={videoRef} 
//           autoPlay 
//           muted 
//           width="100%"
//           className="block"
//         />
//         {!isCameraReady && (
//           <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
//             <p className="text-white">Initializing camera...</p>
//           </div>
//         )}
//       </div>

//       <button
//         onClick={handleRegister}
//         className={`w-full py-2 px-4 rounded font-medium
//           ${(!name || !isCameraReady || !modelsLoaded) 
//             ? 'bg-gray-400 cursor-not-allowed' 
//             : 'bg-blue-600 hover:bg-blue-700 text-white'}
//         `}
//         disabled={!name || !isCameraReady || !modelsLoaded}
//       >
//         Register Face
//       </button>

//       {status.message && (
//         <p className={`mt-4 p-2 rounded text-center
//           ${status.type === 'error' ? 'bg-red-100 text-red-700' :
//             status.type === 'success' ? 'bg-green-100 text-green-700' :
//             'bg-blue-100 text-blue-700'}
//         `}>
//           {status.message}
//         </p>
//       )}

//       <div className="mt-6 text-sm text-gray-600">
//         <p className="font-medium">Instructions:</p>
//         <ul className="list-disc pl-5 space-y-1 mt-1">
//           <li>Position your face in the frame</li>
//           <li>Ensure good lighting conditions</li>
//           <li>Remove glasses if possible</li>
//           <li>Keep a neutral expression</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default Register;

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { db } from '../firebase.ts';
import { ref, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const videoRef = useRef();
  const [name, setName] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // 'environment' or 'user'
  const [stream, setStream] = useState(null);
  const navigate = useNavigate();

  const startCamera = async (facingMode) => {
    // Stop previous stream if exists
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      setStatus({ message: 'Accessing camera...', type: 'info' });
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsCameraReady(true);
      setStatus({ message: 'Camera ready. Please position your face in the frame.', type: 'info' });
    } catch (error) {
      console.error('Camera access error:', error);
      setStatus({ 
        message: `Error: ${error.message}`, 
        type: 'error' 
      });
      
      // Fallback to any available camera
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraReady(true);
        setStatus({ message: 'Camera ready (using available camera).', type: 'info' });
      } catch (fallbackError) {
        setStatus({ 
          message: 'Could not access any camera. Please check permissions.', 
          type: 'error' 
        });
      }
    }
  };

  const toggleCamera = () => {
    const newFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(newFacingMode);
    startCamera(newFacingMode);
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus({ message: 'Loading face detection models...', type: 'info' });
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition')
        ]);
        setModelsLoaded(true);
        startCamera(cameraFacingMode);
      } catch (error) {
        console.error('Model loading error:', error);
        setStatus({ 
          message: `Error loading face detection models: ${error.message}`, 
          type: 'error' 
        });
      }
    };

    loadModels();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleRegister = async () => {
    if (!name.trim()) {
      setStatus({ message: 'Please enter your name', type: 'error' });
      return;
    }

    try {
      setStatus({ message: 'Scanning face...', type: 'info' });
      
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus({ message: 'No face detected. Please try again with proper lighting.', type: 'error' });
        return;
      }

      setStatus({ message: 'Processing face data...', type: 'info' });
      const descriptor = Array.from(detection.descriptor);

      // Generate a more secure ID
      const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Save to Firebase with additional metadata
      await set(ref(db, `clients/${id}`), {
        name: name.trim(),
        descriptor,
        registeredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      setStatus({ 
        message: 'Registration successful! Redirecting...', 
        type: 'success' 
      });
      
      // Stop camera stream before navigating
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setStatus({ 
        message: `Registration failed: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Register New User</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
      </div>

      <div className="relative mb-4 bg-gray-200 rounded-lg overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          width="100%"
          className="block"
        />
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <p className="text-white">Initializing camera...</p>
          </div>
        )}
        {/* Camera switch button */}
        {isCameraReady && (
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
        )}
      </div>

      <button
        onClick={handleRegister}
        className={`w-full py-2 px-4 rounded font-medium
          ${(!name || !isCameraReady || !modelsLoaded) 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'}
        `}
        disabled={!name || !isCameraReady || !modelsLoaded}
      >
        Register Face
      </button>

      {status.message && (
        <p className={`mt-4 p-2 rounded text-center
          ${status.type === 'error' ? 'bg-red-100 text-red-700' :
            status.type === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'}
        `}>
          {status.message}
        </p>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium">Instructions:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Position your face in the frame</li>
          <li>Ensure good lighting conditions</li>
          <li>Remove glasses if possible</li>
          <li>Keep a neutral expression</li>
        </ul>
      </div>
    </div>
  );
};

export default Register;