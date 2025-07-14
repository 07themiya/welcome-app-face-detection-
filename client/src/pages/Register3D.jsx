import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { ref, push, set } from "firebase/database";
import { db } from '../firebase.ts';


const Register3D = () => {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const [name, setName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
//   const [capturePending, setCapturePending] = useState(false);
  const [captureMessage, setCaptureMessage] = useState(null);
  const capturePendingRef = useRef(false);



  // Predict Loop
const predict = async () => {
  if (!videoRef.current || !faceLandmarkerRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    requestAnimationFrame(predict);
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  const drawingUtils = new DrawingUtils(ctx);

  try {
    const result = await faceLandmarkerRef.current.detectForVideo(
      video,
      performance.now()
    );

     console.log("🔍 Detection result:", result.faceLandmarks?.length, result.faceLandmarks);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result?.faceLandmarks?.length) {
      for (const faceLandmarks of result.faceLandmarks) {
        // Draw face landmarks
        drawingUtils.drawConnectors(faceLandmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { 
          color: "#C0C0C070", 
          lineWidth: 1 
        });

        // Only capture if we have a pending request
        if (result?.faceLandmarks?.length && result.faceLandmarks[0]?.length) {
            if (capturePendingRef.current) {
                const normalizedLandmarks = result.faceLandmarks[0].map(landmark => ({
                x: parseFloat(landmark.x.toFixed(6)),
                y: parseFloat(landmark.y.toFixed(6)),
                z: parseFloat(landmark.z.toFixed(6)),
                }));

                console.log("✅ Landmarks captured:", normalizedLandmarks.length, normalizedLandmarks);
                setLandmarks(normalizedLandmarks);
                capturePendingRef.current = false;
                setIsCapturing(false);

                if (!isRegistered) {
                setCaptureMessage("Facial landmarks captured successfully!");
                setTimeout(() => setCaptureMessage(null), 2000);
                }
            }
        }
      }
    }
  } catch (error) {
    console.error("Detection error:", error);
    // setCapturePending(false);
    setIsCapturing(false);
  }

  requestAnimationFrame(predict);
};

const captureLandmarks = () => {
  if (!name) {
    alert("Please enter your name first");
    return;
  }

  console.log("⏳ Attempting to capture landmarks...");
  capturePendingRef.current = true;
  setIsCapturing(true);

  const timeoutId = setTimeout(() => {
    if (capturePendingRef.current) {
      console.log("⚠️ Capture timed out - no face detected");
      capturePendingRef.current = false;
      setIsCapturing(false);
      alert("Couldn't detect a face. Please try again.");
    }
  }, 3000);

  return () => clearTimeout(timeoutId);
};


  const registerCustomer = async () => {
    if (!name) {
        alert("Please enter your name");
        return;
    }
    
    if (!landmarks) {
        alert("Please capture facial landmarks first");
        return;
    }

    console.log("Attempting to register with:", { name, landmarks });

    setIsLoading(true);
  try {
    const customersRef = ref(db, 'clients');
    const newCustomerRef = push(customersRef);
    
    await set(newCustomerRef, {
      name,
      landmarks,
      timestamp: new Date().toISOString()
    });
    
    console.log("Registration successful!");
    setIsRegistered(true);
  } catch (error) {
    console.error("Registration error details:", {
      error: error.message,
      code: error.code,

      fullError: error
    });
    alert(`Registration failed: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  let mounted = true;
  let stream = null;
  let animationFrameId = null;

  const init = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!mounted) return;

      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadeddata = async () => {
        if (!mounted) return;
        await video.play();

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "/tasks-vision@0.10.3"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "face_mesh/face_landmarker.task",
            delegate: "CPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!mounted) return;
        faceLandmarkerRef.current = faceLandmarker;
        animationFrameId = requestAnimationFrame(predict);
      };
    } catch (error) {
      console.error("Initialization error:", error);
      alert(`Camera access error: ${error.message}`);
    }
  };

  init();

  return () => {
    mounted = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
  };
}, []); 

  if (isRegistered) {
    return (
      <div className="registration-success">
        <h2>Registration Successful!</h2>
        <p>Thank you for registering, {name}!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <h1>Customer Registration</h1>
      
      <div className="relative w-full max-w-[800px] h-[600px] mx-auto">

            {/* video view */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover rounded-lg" 
                // style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* canves layer */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                // style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}  
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
            {/* <button
            onClick={toggleCamera}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full"
            aria-label="Switch camera"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            </button> */}

        </div>

      <div className="space-y-2">
        <label htmlFor="name">Full Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-200 px-4 py-2 rounded-lg"
          placeholder="Enter your name"
        />
      </div>

      <div className="space-x-2">
      <button 
        onClick={captureLandmarks} 
        disabled={isCapturing || !name}
        className={`px-4 py-2 rounded-lg ${
          isCapturing ? 'bg-yellow-500' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {isCapturing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Capturing... 
          </span>
        ) : "Capture Facial Landmarks"}
      </button>
        
        <button 
          onClick={registerCustomer} 
        //   disabled={!landmarks || isLoading}
          className="bg-gray-600 px-4 py-2 rounded-lg "

        >
          {isLoading ? "Registering..." : "Register Customer"}
        </button>
      </div>

        {captureMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {captureMessage}
        </div>
        )}
    </div>
  );
};

export default Register3D;