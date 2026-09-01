import React, { useRef, useState, useEffect } from 'react';
import { loadModels, matchFace } from '../utils/faceApi';
import { getEnrolledStaff, logAttendance } from '../utils/storage';
import { AlertCircle, CheckCircle, UserX } from 'lucide-react';

const Scan = () => {
  const videoRef = useRef();
  
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanResult, setScanResult] = useState(null); 
  
  const enrolledStaffRef = useRef([]);
  const isScanning = useRef(false);
  const resultTimeout = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const staff = await getEnrolledStaff();
        enrolledStaffRef.current = staff;
        await loadModels();
        setIsModelsLoaded(true);
        startCamera();
      } catch (err) {
        console.error("Error loading models:", err);
        setCameraError("Failed to load face detection models.");
      }
    };
    init();

    return () => {
      stopCamera();
      isScanning.current = false;
      if (resultTimeout.current) clearTimeout(resultTimeout.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplay = () => {
          isScanning.current = true;
          scanLoop();
        };
      }
    } catch (err) {
      setCameraError("Camera access denied or not found.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanResultRef = useRef(null);

  const showResult = (type, message, staff = null) => {
    const newResult = { type, message, staff };
    setScanResult(newResult);
    scanResultRef.current = newResult;

    if (resultTimeout.current) clearTimeout(resultTimeout.current);
    
    // Clear result after 3 seconds
    resultTimeout.current = setTimeout(() => {
      setScanResult(null);
      scanResultRef.current = null;
    }, 3000);
  };

  const scanLoop = async () => {
    if (!isScanning.current || !videoRef.current) return;

    if (!scanResultRef.current || scanResultRef.current.type === 'error') {
      try {
        const result = await matchFace(videoRef.current, enrolledStaffRef.current);
        
        if (result && result.faceFound) {
          if (result.matched) {
            const staff = result.staff;
            // Attempt to log attendance
            const logRes = await logAttendance(staff.id, staff.name);
            
            if (logRes.success) {
              showResult('success', `${logRes.log.status} Successful`, staff);
            } else {
              // Cooldown active or error
              showResult('info', logRes.message, staff);
            }
          } else {
            showResult('error', 'Not Recognized. Please enroll first.');
          }
        }
      } catch (err) {
        console.error("Scanning error:", err);
      }
    }

    // Loop
    setTimeout(() => {
      if (isScanning.current) {
        requestAnimationFrame(scanLoop);
      }
    }, 500); // 500ms delay between frames to save CPU
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Attendance Scanner</h2>
        <p className="text-gray-600 mt-2">Look at the camera to check-in or check-out</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden shadow-xl aspect-[4/3] border-4 border-white flex items-center justify-center">
          
          {!isModelsLoaded ? (
            <div className="text-white flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
              <span className="text-lg">Loading AI Models...</span>
            </div>
          ) : cameraError ? (
            <div className="text-red-400 text-center px-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-80" />
              <p className="text-lg">{cameraError}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror the video
              />
              
              {/* Scan Overlay UI */}
              <div className="absolute inset-0 border-[6px] border-white/10 pointer-events-none rounded-2xl"></div>
              
              {/* Scanning crosshairs effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className="w-64 h-64 border-2 border-white/50 border-dashed rounded-[40px] animate-[spin_10s_linear_infinite]"></div>
              </div>

              {/* Scan Result Overlay */}
              {scanResult && (
                <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 rounded-xl p-4 shadow-2xl backdrop-blur-md flex items-center space-x-4 min-w-[320px] transition-all duration-300 ${
                  scanResult.type === 'success' ? 'bg-green-500/90 text-white' : 
                  scanResult.type === 'error' ? 'bg-red-500/90 text-white' : 
                  'bg-blue-500/90 text-white'
                }`}>
                  {scanResult.type === 'success' && (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                      {scanResult.staff?.photoUrl && (
                        <img src={scanResult.staff.photoUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  {scanResult.type === 'error' && <UserX className="w-8 h-8 flex-shrink-0" />}
                  {scanResult.type === 'info' && <AlertCircle className="w-8 h-8 flex-shrink-0" />}
                  
                  <div>
                    <div className="font-bold text-lg">
                      {scanResult.staff ? scanResult.staff.name : 'Unknown Face'}
                    </div>
                    <div className="text-sm opacity-90">{scanResult.message}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-8 flex items-center space-x-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${isModelsLoaded && !cameraError ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm font-medium">
            {isModelsLoaded && !cameraError ? 'System Active & Scanning' : 'System Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Scan;
