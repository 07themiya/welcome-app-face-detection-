// import { useEffect, useRef, useState } from 'react';
// import * as faceapi from 'face-api.js';
// import { useNavigate } from 'react-router-dom';
// import { db } from '../firebase.ts';
// import { ref, get } from 'firebase/database';

// const Welcome = () => {
//   const videoRef = useRef();
//   const navigate = useNavigate();
//   const [isScanning, setIsScanning] = useState(false);

//   useEffect(() => {
//     const loadModels = async () => {
//     await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
//     await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
//     await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
//     };

//     const startVideo = () => {
//       navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
//         .then(stream => {
//           videoRef.current.srcObject = stream;
//         });
//     };

//     loadModels().then(startVideo);
//   }, []);

// const handleScan = async () => {
//   setIsScanning(true);
//   try {
//     const detections = await faceapi.detectSingleFace(
//       videoRef.current, 
//       new faceapi.TinyFaceDetectorOptions()
//     ).withFaceLandmarks().withFaceDescriptor();

//     if (!detections) {
//       alert("No face detected");
//       return;
//     }

//     const clientsRef = ref(db, "clients/");
//     const snapshot = await get(clientsRef);
    
//     if (!snapshot.exists()) {
//       navigate('/register');
//       return;
//     }

//     const data = snapshot.val();
//     const labeledDescriptors = Object.entries(data).map(([id, client]) => {
//       return new faceapi.LabeledFaceDescriptors(id, [new Float32Array(client.descriptor)]);
//     });

//     const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
//     const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

//     if (bestMatch.label !== 'unknown') {
//       // Pass the user ID (bestMatch.label) to the appointment page
//       navigate('/appointment', { 
//         state: { 
//           userId: bestMatch.label,
//           // You can also pass additional user data if needed
//           userName: data[bestMatch.label]?.name || 'User'
//         } 
//       });
//     } else {
//       navigate('/register');
//     }
//   } catch (error) {
//     console.error("Scanning error:", error);
//     alert(`Error during face scan: ${error.message}`);
//   } finally {
//     setIsScanning(false);
//   }
// };

//   return (
//     <div className='flex flex-col items-center justify-center h-screen bg-gray-100'>
//         <h1 className='text-2xl font-bold mb-4'>Welcome to Cloud Syntex</h1>
//         <p className='text-gray-600 mb-6'>Please scan your face to proceed</p>
//       <video ref={videoRef} autoPlay muted width="500" height="500" className='border-2 border-gray-300 rounded-lg items-center justify-center'/>
//         <button className='bg-blue-500 text-white px-4 py-2 rounded mt-3' onClick={handleScan} disabled={isScanning}>
//             {isScanning ? 'Scanning...' : 'Scan Face'}
//         </button>
//     </div>
//   );
// };

// export default Welcome;


// import { useEffect, useRef, useState } from 'react';
// import * as faceapi from 'face-api.js';
// import { useNavigate } from 'react-router-dom';
// import { db } from '../firebase.ts';
// import { ref, get } from 'firebase/database';

// const Welcome = () => {
//   const videoRef = useRef();
//   const navigate = useNavigate();
//   const [isScanning, setIsScanning] = useState(false);
//   const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
//   const [stream, setStream] = useState(null);

//   useEffect(() => {
//     const loadModels = async () => {
//       await faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector');
//       await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68');
//       await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition');
//     };

//     const startVideo = async () => {
//       // Stop previous stream if exists
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }

//       try {
//         const mediaStream = await navigator.mediaDevices.getUserMedia({ 
//           video: { 
//             facingMode: cameraFacingMode,
//             width: { ideal: 1280 },
//             height: { ideal: 720 }
//           } 
//         });
//         videoRef.current.srcObject = mediaStream;
//         setStream(mediaStream);
//       } catch (error) {
//         console.error("Camera access error:", error);
//         // Fallback to any available camera
//         try {
//           const mediaStream = await navigator.mediaDevices.getUserMedia({ 
//             video: true 
//           });
//           videoRef.current.srcObject = mediaStream;
//           setStream(mediaStream);
//         } catch (fallbackError) {
//           console.error("Fallback camera access error:", fallbackError);
//           alert("Could not access any camera. Please check permissions.");
//         }
//       }
//     };

//     loadModels().then(startVideo);

//     // Cleanup function
//     return () => {
//       if (stream) {
//         stream.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, [cameraFacingMode]); // Re-run when cameraFacingMode changes

//   const toggleCamera = () => {
//     setCameraFacingMode(prevMode => 
//       prevMode === 'environment' ? 'user' : 'environment'
//     );
//   };

//   const handleScan = async () => {
//     setIsScanning(true);
//     try {
//       const detections = await faceapi.detectSingleFace(
//         videoRef.current, 
//         new faceapi.TinyFaceDetectorOptions()
//       ).withFaceLandmarks().withFaceDescriptor();

//       if (!detections) {
//         alert("No face detected");
//         return;
//       }

//       const clientsRef = ref(db, "clients/");
//       const snapshot = await get(clientsRef);
      
//       if (!snapshot.exists()) {
//         navigate('/register');
//         return;
//       }

//       const data = snapshot.val();
//       const labeledDescriptors = Object.entries(data).map(([id, client]) => {
//         return new faceapi.LabeledFaceDescriptors(id, [new Float32Array(client.descriptor)]);
//       });

//       const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
//       const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

//       if (bestMatch.label !== 'unknown') {
//         navigate('/appointment', { 
//           state: { 
//             userId: bestMatch.label,
//             userName: data[bestMatch.label]?.name || 'User'
//           } 
//         });
//       } else {
//         navigate('/register');
//       }
//     } catch (error) {
//       console.error("Scanning error:", error);
//       alert(`Error during face scan: ${error.message}`);
//     } finally {
//       setIsScanning(false);
//     }
//   };

//   return (
//     <div className='flex flex-col items-center justify-center h-screen bg-gray-100 p-4'>
//       <h1 className='text-2xl font-bold mb-4'>Welcome to Cloud Syntex</h1>
//       <p className='text-gray-600 mb-6'>Please scan your face to proceed</p>
      
//       {/* Video container with relative positioning for camera button */}
//       <div className="relative">
//         <video 
//           ref={videoRef} 
//           autoPlay 
//           muted 
//           width="500" 
//           height="500" 
//           className='border-2 border-gray-300 rounded-lg object-cover w-full max-w-md aspect-square'
//         />
//         {/* Camera switch button (positioned absolutely in top-right corner) */}
//         <button
//           onClick={toggleCamera}
//           className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full"
//           aria-label="Switch camera"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
//           </svg>
//         </button>
//       </div>
      
//       <button 
//         className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg mt-6 w-full max-w-md transition-colors disabled:bg-blue-400' 
//         onClick={handleScan} 
//         disabled={isScanning}
//       >
//         {isScanning ? 'Scanning...' : 'Scan Face'}
//       </button>
//     </div>
//   );
// };

// export default Welcome;


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
      if (isScanning || !videoRef.current) return;

      try {
        const video = videoRef.current;
        if (!video || video.readyState !== 4) return; // Check if video is ready
        
        const detections = await faceapi.detectSingleFace(
          video, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        if (detections) {
          setStatus("Face detected - scanning...");
          await processFaceDetection();
        }
      } catch (error) {
        console.error("Detection error:", error);
        setStatus("Detection error - retrying");
      }
    }, 1000); // Reduced frequency to 1 second
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
      
      <div className="relative">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          width="500" 
          height="500" 
          className='border-2 border-gray-300 rounded-lg object-cover w-full max-w-md aspect-square'
        />
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
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="animate-pulse text-white text-lg">Scanning...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;