import React, { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  FaceLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { ref, get, child } from "firebase/database";
import { db } from "../firebase.ts";
import { useNavigate } from 'react-router-dom';


const Welcome3D = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const blinkCountRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const [matchFound, setMatchFound] = useState(false);
  const navigate = useNavigate();
  const [status, setStatus] = useState('Position your face in front of the camera');
  const recognitionInProgressRef = useRef(false);



  const getEAR = (landmarks, eyeIndices) => {
    const vertical1 = Math.hypot(
      landmarks[eyeIndices[1]].x - landmarks[eyeIndices[5]].x,
      landmarks[eyeIndices[1]].y - landmarks[eyeIndices[5]].y
    );
    const vertical2 = Math.hypot(
      landmarks[eyeIndices[2]].x - landmarks[eyeIndices[4]].x,
      landmarks[eyeIndices[2]].y - landmarks[eyeIndices[4]].y
    );
    const horizontal = Math.hypot(
      landmarks[eyeIndices[0]].x - landmarks[eyeIndices[3]].x,
      landmarks[eyeIndices[0]].y - landmarks[eyeIndices[3]].y
    );
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };

  const leftEyeIndices = [33, 160, 158, 133, 153, 144];

  const isFaceCentered = (landmarks, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const faceX = landmarks[1].x * width;
    const faceY = landmarks[1].y * height;
    const threshold = 80;
    return (
      Math.abs(faceX - centerX) < threshold &&
      Math.abs(faceY - centerY) < threshold
    );
  };

  // const areLandmarksMatching = (a, b, tolerance = 0.01) => {
  //   if (a.length !== b.length) return false;
  //   for (let i = 0; i < a.length; i++) {
  //     if (
  //       Math.abs(a[i].x - b[i].x) > tolerance ||
  //       Math.abs(a[i].y - b[i].y) > tolerance ||
  //       Math.abs(a[i].z - b[i].z) > tolerance
  //     ) {
  //       return false;
  //     }
  //   }
  //   return true;
  // };

  const areLandmarksMatching = (lm1, lm2, threshold = 0.025) => {
  if (!lm1 || !lm2 || !Array.isArray(lm1) || !Array.isArray(lm2) || lm1.length !== lm2.length) return false;

  let totalDiff = 0;
  for (let i = 0; i < lm1.length; i++) {
    const dx = lm1[i].x - lm2[i].x;
    const dy = lm1[i].y - lm2[i].y;
    const dz = lm1[i].z - lm2[i].z;
    totalDiff += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const avgDiff = totalDiff / lm1.length;
  return avgDiff < threshold;
};


  const recognizeUser = async (detectedLandmarks) => {
    const snapshot = await get(child(ref(db), "clients"));
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const key in users) {
        const userLandmarks = users[key].landmarks;
        if (areLandmarksMatching(userLandmarks, detectedLandmarks)) {
          const userName = users[key].name;
          console.log("✅ User matched:", userName);

          setStatus(`User matched: ${userName}`);
          setMatchFound(true);

          // Navigate with user details
          navigate('/appointment', {
            state: {
              userId: key,
              userName: userName
            }
  });

  return; // Exit after finding the match
}
      }
    }
    console.log("❌ No matching user found");
    setStatus("No matching user found");
    // setTimeout(() => {
    //   navigate('/register');
    // }, 2000);
  };

  const predict = async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || matchFound) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      requestAnimationFrame(predict);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(ctx);

    const result = await faceLandmarkerRef.current.detectForVideo(
      video,
      performance.now()
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result?.faceLandmarks?.length) {
      for (const landmarks of result.faceLandmarks) {
        const EAR_THRESHOLD = 0.23;
        const ear = getEAR(landmarks, leftEyeIndices);

        if (ear < EAR_THRESHOLD && !isBlinkingRef.current) {
          blinkCountRef.current += 1;
          isBlinkingRef.current = true;
          console.log("👁️ Blink detected! Total:", blinkCountRef.current);
          setStatus("Blink detected!");
        } else if (ear >= EAR_THRESHOLD) {
          isBlinkingRef.current = false;
        }

        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#C0C0C070", lineWidth: 1 }
        );
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });

        if (
          isFaceCentered(landmarks, video.videoWidth, video.videoHeight) &&
          blinkCountRef.current >= 1
        ) {
          console.log("🎯 Face centered and blink detected. Attempting recognition...");
          setStatus("Face centered and blink detected. Attempting recognition...");

          if (recognitionInProgressRef.current) return;
          recognitionInProgressRef.current = true;
          await recognizeUser(
            landmarks.map((lm) => ({
              x: +lm.x.toFixed(6),
              y: +lm.y.toFixed(6),
              z: +lm.z.toFixed(6),
            }))
          );
          recognitionInProgressRef.current = false;

        }
      }
    }

    requestAnimationFrame(predict);
  };

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadeddata = async () => {
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

        faceLandmarkerRef.current = faceLandmarker;
        console.log("✅ FaceLandmarker initialized");
        requestAnimationFrame(predict);
      };
    };

  //   init();
  // }, [predict]);

      init();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <h1 className='text-2xl font-bold mb-4'>Welcome to Cloud Syntex</h1>
      <p className='text-gray-600 mb-6'>{status}</p>
    <div className="relative w-full max-w-[800px] h-[600px] mx-auto">

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="border-2 border-dashed border-white rounded-[50%/40%_40%_60%_60%] w-60 h-80 opacity-50"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white opacity-70 transform -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white opacity-70 transform -translate-x-1/2"></div>
        </div>
      </div>
    </div>

    <button           
    onClick={() => navigate('/register')}
    className="bg-blue-500 hover:underline rounded-lg text-white px-4 py-2 mb-6">
      Register
    </button>

    </div>
  );
};

export default Welcome3D;
