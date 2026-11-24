import "./style.css";

import {
    initializeHandTracking,
    detectHands,
    drawHands
} from "./handTracking.js";

import {
    initializeParticles,
    setParticleGesture
} from "./particles.js";

import {
    detectGesture,
    detectLeftGesture
} from "./gesture.js";

const video = document.querySelector("#webcam");
const canvas = document.querySelector("#hand-canvas");
const startButton = document.querySelector("#start-camera");
const status = document.querySelector("#status");
const cameraSelect = document.querySelector("#camera-select");

async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const cameras = devices.filter(
        device => device.kind === "videoinput"
    );

    cameraSelect.innerHTML = "";

    cameras.forEach((camera, index) => {
        const option = document.createElement("option");

        option.value = camera.deviceId;
        option.textContent = camera.label || `Camera ${index + 1}`;

        cameraSelect.appendChild(option);
    });
}

async function initializeCameras() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });

    try {
        await getCameras();
    } finally {
        stream.getTracks().forEach(track => track.stop());
    }
}

initializeCameras().catch(console.error);

// Start webcam
async function startCamera() {

    startButton.disabled = true;
    status.textContent = "Loading MediaPipe...";

    let stream;

    try {

        await initializeHandTracking();

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: cameraSelect.value
                    ? { exact: cameraSelect.value }
                    : undefined,
                width: 640,
                height: 480
            },
            audio: false
        });

        video.srcObject = stream;

        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        status.textContent = "Hand tracking active";

        requestAnimationFrame(update);

    } catch (error) {

        stream?.getTracks().forEach(track => track.stop());

        console.error(error);
        status.textContent = error.message;
        startButton.disabled = false;
    }
}

let fastRotationActive = false;
let explosionArmed = false;
let lastChargeTime = 0;

// Real-time processing loop
function update() {

    const results = detectHands(video);

    if (results !== null) {

        drawHands(canvas, results);

        let rightHand = null;
        let leftHand = null;

        const handedness =
            results.handedness ??
            results.handednesses ??
            [];

        // Identify left and right hands
        for (let i = 0; i < results.landmarks.length; i++) {

            const label =
                handedness[i]?.[0]?.categoryName;

            const hand = {
                landmarks: results.landmarks[i],
                worldLandmarks:
                    results.worldLandmarks?.[i]
                    ?? results.landmarks[i]
            };

            if (label === "Right") {
                rightHand = hand;

            } else if (label === "Left") {
                leftHand = hand;
            }
        }

        // Recognize right-hand gesture
        const rightGesture = detectGesture(
            rightHand?.worldLandmarks
        );

        // Recognize left-hand pointing
        const leftGesture = detectLeftGesture(
            leftHand?.worldLandmarks
        );

        // Activate manual rotation
        // Detect rotation commands
        // Two-handed gestures
        const bothClosed =
            rightGesture === "CLOSED_FIST" &&
            leftGesture === "CLOSED_FIST";

        const bothOpen =
            rightGesture === "OPEN_PALM" &&
            leftGesture === "OPEN_PALM";

        // Rotation gestures
        const manualRotation =
            rightGesture === "OPEN_PALM" &&
            leftGesture === "POINTING";

        const fastCommand =
            rightGesture === "OPEN_PALM" &&
            leftGesture === "TWO_FINGERS";

        const pullCommand =
            rightGesture === "OPEN_PALM" &&
            leftGesture === "THREE_FINGERS";

        const now = performance.now();

        let mode = "AUTO";

        // 1. Charge energy
        if (bothClosed) {

            explosionArmed = true;
            lastChargeTime = now;

            fastRotationActive = false;

            setParticleGesture("CHARGE");

            mode = "CHARGING";

        // 2. Release energy
        } else if (
            bothOpen &&
            explosionArmed &&
            now - lastChargeTime < 3000
        ) {

            explosionArmed = false;
            fastRotationActive = false;

            setParticleGesture("EXPLODE");

            mode = "EXPLOSION";

        // 3. Maintain charge during gesture transition
        } else if (
            explosionArmed &&
            now - lastChargeTime < 3000
        ) {

            setParticleGesture("CHARGE");

            mode = "READY TO EXPLODE";

        // 4. Normal interaction
        } else {

            explosionArmed = false;

            if (
                rightGesture === "CLOSED_FIST" ||
                manualRotation ||
                bothOpen ||
                pullCommand
            ) {

                fastRotationActive = false;

            } else if (fastCommand) {

                fastRotationActive = true;
            }

            if (pullCommand) {

                setParticleGesture(
                    "PULL",
                    leftHand.landmarks
                );

                mode = "ELASTIC PULL";

            } else if (fastRotationActive) {

                setParticleGesture(
                    "FAST_ROTATE",
                    fastCommand
                        ? leftHand.landmarks
                        : undefined,
                    video.videoWidth / video.videoHeight
                );

                mode = "CONTINUOUS ROTATION";

            } else if (manualRotation) {

                setParticleGesture(
                    "ROTATE",
                    leftHand.landmarks
                );

                mode = "MANUAL ROTATION";

            } else {

                setParticleGesture(rightGesture);
            }
        }

        // Display detection results
        status.textContent =
            `Right: ${rightGesture} | ` +
            `Left: ${leftGesture} | ` +
            `Mode: ${mode}`;
      }

      requestAnimationFrame(update);
}

startButton.addEventListener("click", startCamera);

initializeParticles();