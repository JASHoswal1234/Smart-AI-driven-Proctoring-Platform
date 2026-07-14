export const drawRect = (detections, ctx) => {
  // Loop through each prediction
  detections.forEach((prediction) => {
    // Extract boxes and classes
    const [x, y, width, height] = prediction["bbox"];
    const text = prediction["class"];

    // Set styling
    const color = Math.floor(Math.random() * 16777215).toString(16);
    ctx.strokeStyle = "#" + color;
    ctx.font = "18px Arial";
    ctx.lineWidth = 2;

    // Draw rectangles and text
    ctx.beginPath();
    ctx.fillStyle = "#" + color;
    ctx.fillText(text, x, y);
    ctx.rect(x, y, width, height);
    ctx.stroke();
  });
};

// Draw face rectangles from FaceMesh landmarks
export const drawFaceRect = (faceLandmarks, ctx, canvas) => {
  if (!faceLandmarks || faceLandmarks.length === 0) return;

  faceLandmarks.forEach((landmarks, index) => {
    // Get bounding box from landmarks
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    landmarks.forEach((lm) => {
      minX = Math.min(minX, lm.x);
      maxX = Math.max(maxX, lm.x);
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
    });

    // Convert normalized coordinates to canvas coordinates
    const x = minX * canvas.width;
    const y = minY * canvas.height;
    const width = (maxX - minX) * canvas.width;
    const height = (maxY - minY) * canvas.height;

    // Draw rectangle
    ctx.strokeStyle = faceLandmarks.length > 1 ? '#ff0000' : '#00ff00'; // Red for multiple, green for single
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    // Draw label
    ctx.fillStyle = faceLandmarks.length > 1 ? '#ff0000' : '#00ff00';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(faceLandmarks.length > 1 ? `Face ${index + 1}` : 'Face OK', x, y - 5);
  });
};
