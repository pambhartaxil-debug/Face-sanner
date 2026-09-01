import * as faceapi from 'face-api.js';

export const loadModels = async () => {
  const MODEL_URL = import.meta.env.BASE_URL + 'models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ]);
};

export const getFaceDescriptor = async (imageElement) => {
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  return detection ? detection.descriptor : null;
};

// Converts the Float32Array descriptor to a regular array for JSON storage
export const descriptorToArray = (descriptor) => {
  return Array.from(descriptor);
};

// Converts stored array back to Float32Array
export const arrayToDescriptor = (arr) => {
  return new Float32Array(arr);
};

export const matchFace = async (videoElement, enrolledStaff) => {
  const detection = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  if (enrolledStaff.length === 0) return { matched: false, faceFound: true };

  // Create LabeledFaceDescriptors from enrolled staff
  const labeledDescriptors = enrolledStaff.map(staff => {
    return new faceapi.LabeledFaceDescriptors(
      staff.id, // We'll use staffId as the label
      [arrayToDescriptor(staff.descriptor)]
    );
  });

  // Lower threshold = stricter matching. 0.45 prevents false positives better than 0.6
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
  const match = faceMatcher.findBestMatch(detection.descriptor);

  if (match.label !== 'unknown') {
    const matchedStaff = enrolledStaff.find(s => s.id === match.label);
    return {
      matched: true,
      faceFound: true,
      staff: matchedStaff,
      distance: match.distance
    };
  }

  return { matched: false, faceFound: true, distance: match.distance };
};
