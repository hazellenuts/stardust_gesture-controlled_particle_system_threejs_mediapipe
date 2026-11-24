// Calculate the angle between three landmarks
function calculateAngle(a, b, c) {

    const u = {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };

    const v = {
        x: c.x - b.x,
        y: c.y - b.y,
        z: c.z - b.z
    };

    const dotProduct =
        u.x * v.x +
        u.y * v.y +
        u.z * v.z;

    const magnitudeU = Math.hypot(u.x, u.y, u.z);
    const magnitudeV = Math.hypot(v.x, v.y, v.z);

    if (magnitudeU === 0 || magnitudeV === 0) {
        return NaN;
    }

    const cosine =
        dotProduct / (magnitudeU * magnitudeV);

    const clampedCosine = Math.max(
        -1,
        Math.min(1, cosine)
    );

    return Math.acos(clampedCosine) * (180 / Math.PI);
}

let previousGesture = "NO_HAND";
let previousLeftGesture = "NO_HAND";

// Recognize right-hand gesture
export function detectGesture(landmarks) {

    if (!landmarks || landmarks.length !== 21) {
        previousGesture = "NO_HAND";
        return previousGesture;
    }

    const fingers = [
        [5, 6, 7],
        [9, 10, 11],
        [13, 14, 15],
        [17, 18, 19]
    ];

    const angles = fingers.map(([a, b, c]) =>
        calculateAngle(
            landmarks[a],
            landmarks[b],
            landmarks[c]
        )
    );

    const openThreshold =
        previousGesture === "OPEN_PALM"
            ? 135
            : 145;

    const extendedFingers = angles.filter(
        angle => angle >= openThreshold
    ).length;

    const curledFingers = angles.filter(
        angle => angle < 125
    ).length;

    if (extendedFingers === 4) {
        previousGesture = "OPEN_PALM";

    } else if (curledFingers === 4) {
        previousGesture = "CLOSED_FIST";

    } else {
        previousGesture = "NEUTRAL";
    }

    return previousGesture;
}

// Recognize left-hand pointing gesture
export function detectLeftGesture(landmarks) {

    if (!landmarks || landmarks.length !== 21) {
        previousLeftGesture = "NO_HAND";
        return previousLeftGesture;
    }

    const indexAngle = calculateAngle(
        landmarks[5], landmarks[6], landmarks[7]
    );

    const middleAngle = calculateAngle(
        landmarks[9], landmarks[10], landmarks[11]
    );

    const ringAngle = calculateAngle(
        landmarks[13], landmarks[14], landmarks[15]
    );

    const pinkyAngle = calculateAngle(
        landmarks[17], landmarks[18], landmarks[19]
    );

    // Detect open palm and closed fist
    const angles = [
        indexAngle,
        middleAngle,
        ringAngle,
        pinkyAngle
    ];

    const openThreshold =
        previousLeftGesture === "OPEN_PALM"
            ? 135
            : 145;

    if (angles.every(angle => angle >= openThreshold)) {

        previousLeftGesture = "OPEN_PALM";
        return previousLeftGesture;
    }

    if (angles.every(angle => angle < 125)) {

        previousLeftGesture = "CLOSED_FIST";
        return previousLeftGesture;
    }

    // Hysteresis
    const wasRotating =
        previousLeftGesture === "POINTING" ||
        previousLeftGesture === "TWO_FINGERS";

    const extendedThreshold = wasRotating ? 135 : 150;
    const curledThreshold = wasRotating ? 150 : 135;

    const middleExtendedThreshold =
        previousLeftGesture === "TWO_FINGERS"
            ? 135 : 140;

    const middleCurledThreshold =
        previousLeftGesture === "POINTING"
            ? 135 : 125;

    // Three fingers
    const threeFingerExtendedThreshold =
        previousLeftGesture === "THREE_FINGERS"
            ? 135 : 150;

    const threeFingerCurledThreshold =
        previousLeftGesture === "THREE_FINGERS"
            ? 150 : 135;

    if (
        indexAngle >= threeFingerExtendedThreshold &&
        middleAngle >= threeFingerExtendedThreshold &&
        ringAngle >= threeFingerExtendedThreshold &&
        pinkyAngle < threeFingerCurledThreshold
    ) {
        previousLeftGesture = "THREE_FINGERS";
        return previousLeftGesture;
    }

    // Two fingers
    if (
        indexAngle >= extendedThreshold &&
        middleAngle >= middleExtendedThreshold &&
        ringAngle < curledThreshold &&
        pinkyAngle < curledThreshold
    ) {

        previousLeftGesture = "TWO_FINGERS";

    // One finger
    } else if (
        indexAngle >= extendedThreshold &&
        middleAngle < middleCurledThreshold &&
        ringAngle < curledThreshold &&
        pinkyAngle < curledThreshold
    ) {

        previousLeftGesture = "POINTING";

    } else {

        previousLeftGesture = "NEUTRAL";
    }

    return previousLeftGesture;
}