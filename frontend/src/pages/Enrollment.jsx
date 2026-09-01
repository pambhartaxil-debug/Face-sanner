import React, { useRef, useState, useEffect } from 'react';
import { loadModels, getFaceDescriptor, descriptorToArray } from '../utils/faceApi';
import { enrollStaff, getEnrolledStaff } from '../utils/storage';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';

const Enrollment = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [formData, setFormData] = useState({ name: '', staffId: '', department: '' });
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [status, setStatus] = useState(''); // 'scanning', 'success', 'error'
  const [message, setMessage] = useState('');
  const [enrolledList, setEnrolledList] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        await loadModels();
        setIsModelsLoaded(true);
        startCamera();
        const staff = await getEnrolledStaff();
        setEnrolledList(staff);
      } catch (err) {
        console.error("Error loading models:", err);
        setCameraError("Failed to load face detection models.");
      }
    };
    init();

    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const captureFace = async () => {
    if (!videoRef.current) return;
    
    setStatus('scanning');
    setMessage('Detecting face...');
    
    const faceDescriptor = await getFaceDescriptor(videoRef.current);
    
    if (faceDescriptor) {
      setDescriptor(descriptorToArray(faceDescriptor));
      
      // Capture photo for thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      setCapturedPhoto(canvas.toDataURL('image/jpeg'));
      
      setStatus('success');
      setMessage('Face captured successfully!');
    } else {
      setStatus('error');
      setMessage('No face detected. Please face the camera and try again.');
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!descriptor) {
      setStatus('error');
      setMessage('Please capture your face first.');
      return;
    }
    
    const newStaff = {
      id: formData.staffId,
      name: formData.name,
      department: formData.department,
      descriptor: descriptor,
      photoUrl: capturedPhoto
    };
    
    try {
      await enrollStaff(newStaff);
      const updatedStaff = await getEnrolledStaff();
      setEnrolledList(updatedStaff);
      
      // Reset
      setFormData({ name: '', staffId: '', department: '' });
      setDescriptor(null);
      setCapturedPhoto(null);
      setStatus('');
      setMessage('');
      alert('Staff enrolled successfully!');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to enroll staff');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Enroll Staff Member</h2>
        <p className="text-gray-600 mt-1">Register a new staff member with their face data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form & Camera */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleEnroll} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                required type="text" name="name" value={formData.name} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                <input 
                  required type="text" name="staffId" value={formData.staffId} onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="EMP-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input 
                  required type="text" name="department" value={formData.department} onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Engineering"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Face Capture</label>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {!isModelsLoaded ? (
                  <div className="text-white flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                    Loading AI Models...
                  </div>
                ) : cameraError ? (
                  <div className="text-red-400 text-sm flex items-center bg-red-900/20 px-4 py-2 rounded">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {cameraError}
                  </div>
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover ${capturedPhoto ? 'hidden' : 'block'}`}
                  />
                )}
                
                {capturedPhoto && (
                  <img src={capturedPhoto} alt="Captured face" className="w-full h-full object-cover" />
                )}
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={capturedPhoto ? () => { setCapturedPhoto(null); setDescriptor(null); setStatus(''); } : captureFace}
                  disabled={!isModelsLoaded || !!cameraError}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                    capturedPhoto 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {capturedPhoto ? 'Retake Photo' : 'Capture Face'}
                </button>
                
                {status && (
                  <div className={`text-sm flex items-center ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                    {status === 'success' && <CheckCircle className="w-4 h-4 mr-1" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4 mr-1" />}
                    {message}
                  </div>
                )}
              </div>
            </div>
            
            <hr className="my-6" />
            
            <button
              type="submit"
              disabled={!descriptor}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Complete Enrollment
            </button>
          </form>
        </div>

        {/* Right Column: Enrolled Staff List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Staff ({enrolledList.length})</h3>
          
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {enrolledList.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No staff enrolled yet.</p>
            ) : (
              enrolledList.map((staff, idx) => (
                <div key={idx} className="flex items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {staff.photoUrl ? (
                      <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{staff.name}</h4>
                    <div className="text-xs text-gray-500 flex justify-between mt-0.5">
                      <span>{staff.id}</span>
                      <span>{staff.department}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
