import {
    HandLandmarker,
    FilesetResolver,
    DrawingUtils
} from "@mediapipe/tasks-vision";

let handLandmarker;
let lastVideoTime = -1;

// Initialize MediaPipe
export async function initializeHandTracking() {

    const vision = await FilesetResolver.forVisionTasks(
        `${import.meta.env.BASE_URL}wasm`
    );

    handLandmarker = await HandLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "CPU"
            },

            runningMode: "VIDEO",
            numHands: 2,

            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        }
    );

    console.log("Hand Landmarker initialized");
}

// Detect hand landmarks
export function detectHands(video) {

    if (!handLandmarker || video.readyState < 2) {
        return null;
    }

    if (video.currentTime === lastVideoTime) {
        return null;
    }

    lastVideoTime = video.currentTime;

    return handLandmarker.detectForVideo(
        video,
        performance.now()
    );
}

// Draw hand landmarks
export function drawHands(canvas, results) {

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawingUtils = new DrawingUtils(ctx);

    for (const landmarks of results.landmarks) {

        drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            {
                color: "#c084fc",
                lineWidth: 3
            }
        );

        drawingUtils.drawLandmarks(
            landmarks,
            {
                color: "#f9a8d4",
                radius: 4
            }
        );
    }
}