import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import * as THREE from "three";

let targetScale = 1;
// Explosion settings
let explosionAge = Infinity;

const explosionDuration = 2.5;
const explosionStrength = 1.8;

// Rotation states
let targetRotationX = 0;
let targetRotationY = 0;

let isRotating = false;
let isFastRotating = false;

let previousPointerPosition = null;

// Continuous rotation direction
let fastDirectionX = 0;
let fastDirectionY = 0;

// Elastic pull states
let isPulling = false;
let pullAnchor = null;

let pullOffsetX = 0;
let pullOffsetY = 0;

// Elastic pull settings
const pullSensitivity = 2.5;
const maxPullDistance = 5;
const pullSpringStrength = 65;
const pullDamping = 12;

// Particle trail settings
const pullTrailStrength = 1.8;
const trailGroupCount = 48;
const trailMinSpeed = 1.2;
const trailMaxSpeed = 22;

// Rotation settings
const rotationSensitivity = 5;
const fastRotationSpeed = 8;

export function setParticleGesture(
    gesture,
    landmarks,
    aspectRatio = 1
) {

    isRotating =
        gesture === "ROTATE" && !!landmarks;

    isFastRotating =
        gesture === "FAST_ROTATE";

    isPulling =
        gesture === "PULL" && !!landmarks;

    switch (gesture) {

        case "OPEN_PALM":
        case "ROTATE":
        case "FAST_ROTATE":
        case "PULL":
            targetScale = 1.6;
            break;

        case "CLOSED_FIST":
            targetScale = 0.4;
            break;

        case "CHARGE":
            targetScale = 0.18;
            explosionAge = Infinity;
            break;

        case "EXPLODE":
            targetScale = 1.6;
            explosionAge = 0;
            break;

        default:
            targetScale = 1;
    }

    // Elastic pull control
    if (isPulling) {

        const currentPosition = {
            x: 1 - landmarks[9].x,
            y: 1 - landmarks[9].y
        };

        // Save the initial hand position
        if (pullAnchor === null) {
            pullAnchor = currentPosition;
        }

        // Calculate displacement from initial position
        pullOffsetX =
            (currentPosition.x - pullAnchor.x)
            * pullSensitivity;

        pullOffsetY =
            (currentPosition.y - pullAnchor.y)
            * pullSensitivity;

    } else {

        // Release the sphere
        pullAnchor = null;

        pullOffsetX = 0;
        pullOffsetY = 0;
    }

    // Continuous rotation
    if (isFastRotating) {

        previousPointerPosition = null;

        if (landmarks) {

            // Midpoint of index and middle finger bases
            const baseX =
                (landmarks[5].x + landmarks[9].x) / 2;

            const baseY =
                (landmarks[5].y + landmarks[9].y) / 2;

            // Midpoint of index and middle fingertips
            const tipX =
                (landmarks[8].x + landmarks[12].x) / 2;

            const tipY =
                (landmarks[8].y + landmarks[12].y) / 2;

            // Finger direction (mirrored camera)
            const directionX =
                (baseX - tipX) * aspectRatio;

            const directionY =
                tipY - baseY;

            const magnitude = Math.hypot(
                directionX,
                directionY
            );

            if (magnitude > 0.025) {

                fastDirectionX =
                    directionX / magnitude;

                fastDirectionY =
                    directionY / magnitude;
            }
        }

        return;
    }

    fastDirectionX = 0;
    fastDirectionY = 0;

    // Manual rotation
    if (isRotating) {

        const currentPosition = {
            x: 1 - landmarks[8].x,
            y: landmarks[8].y
        };

        if (previousPointerPosition !== null) {

            const deltaX =
                currentPosition.x -
                previousPointerPosition.x;

            const deltaY =
                currentPosition.y -
                previousPointerPosition.y;

            targetRotationY +=
                deltaX * rotationSensitivity;

            targetRotationX +=
                deltaY * rotationSensitivity;
        }

        previousPointerPosition = currentPosition;

    } else {

        previousPointerPosition = null;
    }
}

export function initializeParticles() {

    const container = document.querySelector(
        "#particle-container"
    );

    // 1. Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05030a");

    // 2. Create virtual camera
    const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    camera.position.z = 12;

    // 3. Create renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    container.appendChild(renderer.domElement);

    // 4. Generate particle positions
    const particleCount = 5000;

    const positions = new Float32Array(
        particleCount * 3
    );

    const colors = new Float32Array(
        particleCount * 3
    );

    const palette = [
        "#c084fc",
        "#f9a8d4",
        "#93c5fd",
        "#ffffff"
    ];

    for (let i = 0; i < particleCount; i++) {

        const radius = 3 * Math.cbrt(Math.random());

        const theta = Math.random() * Math.PI * 2;

        const phi = Math.acos(
            2 * Math.random() - 1
        );

        positions[i * 3] =
            radius * Math.sin(phi) * Math.cos(theta);

        positions[i * 3 + 1] =
            radius * Math.sin(phi) * Math.sin(theta);

        positions[i * 3 + 2] =
            radius * Math.cos(phi);

        const color = new THREE.Color(
            palette[
                Math.floor(Math.random() * palette.length)
            ]
        );

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    const originalPositions = positions.slice();

    // Random burst offset for each particle
    const burstOffsets = new Float32Array(
        particleCount * 3
    );

    for (let i = 0; i < particleCount; i++) {

        const index = i * 3;

        // Original direction from center
        const ox = originalPositions[index];
        const oy = originalPositions[index + 1];
        const oz = originalPositions[index + 2];

        const originalLength =
            Math.hypot(ox, oy, oz) || 1;

        const originalDir = {
            x: ox / originalLength,
            y: oy / originalLength,
            z: oz / originalLength
        };

        // Random direction
        let rx = Math.random() * 2 - 1;
        let ry = Math.random() * 2 - 1;
        let rz = Math.random() * 2 - 1;

        const randomLength =
            Math.hypot(rx, ry, rz) || 1;

        rx /= randomLength;
        ry /= randomLength;
        rz /= randomLength;

        // Blend original direction + random direction
        // so it still feels like exploding outward,
        // but no longer forms a perfect sphere
        let dx =
            originalDir.x * 0.35 + rx * 0.65;
        let dy =
            originalDir.y * 0.35 + ry * 0.65;
        let dz =
            originalDir.z * 0.35 + rz * 0.65;

        const dirLength =
            Math.hypot(dx, dy, dz) || 1;

        dx /= dirLength;
        dy /= dirLength;
        dz /= dirLength;

        // Explosion distance
        const distance =
            4 + Math.random() * 10;

        burstOffsets[index] = dx * distance;
        burstOffsets[index + 1] = dy * distance;
        burstOffsets[index + 2] = dz * distance;
    }

    let burstWasActive = false;

    // 5. Create particle geometry
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
    );

    // 6. Create glowing particle texture
    const textureCanvas = document.createElement("canvas");

    textureCanvas.width = 64;
    textureCanvas.height = 64;

    const ctx = textureCanvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
        32, 32, 0,
        32, 32, 32
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.15, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.6)");
    gradient.addColorStop(0.65, "rgba(255,255,255,0.15)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(textureCanvas);

    // 7. Create particle material
    const material = new THREE.PointsMaterial({
        size: 0.22,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    // 8. Add particles to scene
    const particles = new THREE.Points(
        geometry,
        material
    );

    scene.add(particles);

    // Post-processing
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
            container.clientWidth,
            container.clientHeight
        ),
        0.4,  // Strength
        0.8,  // Radius
        0.5   // Threshold
    );

    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    function updateExplosion(deltaTime) {

        if (explosionAge >= explosionDuration) {

            if (burstWasActive) {

                positions.set(originalPositions);
                geometry.attributes.position.needsUpdate = true;

                burstWasActive = false;
            }

            return;
        }

        burstWasActive = true;
        explosionAge += deltaTime;

        const progress = Math.min(
            explosionAge / explosionDuration,
            1
        );

        // Fast burst, slow recovery
        const peak = 0.22;

        let envelope;

        if (progress < peak) {

            envelope = Math.sin(
                (progress / peak) * Math.PI / 2
            );

        } else {

            envelope = Math.pow(
                (1 - progress) / (1 - peak),
                1.1
            );
        }

        // Move particles to burst offsets
        for (let i = 0; i < particleCount; i++) {

            const index = i * 3;

            positions[index] =
                originalPositions[index] +
                burstOffsets[index] * envelope;

            positions[index + 1] =
                originalPositions[index + 1] +
                burstOffsets[index + 1] * envelope;

            positions[index + 2] =
                originalPositions[index + 2] +
                burstOffsets[index + 2] * envelope;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    const pullTarget = new THREE.Vector3();
    const pullVelocity = new THREE.Vector3();
    const pullDisplacement = new THREE.Vector3();

    // Particle trail states
    let trailWasActive = false;

    const inverseRotation = new THREE.Quaternion();

    const trailGroups = Array.from(
        { length: trailGroupCount },
        (_, i) => {

            const t = i / (trailGroupCount - 1);

            return {
                position: new THREE.Vector3(),
                offset: new THREE.Vector3(),

                speed: THREE.MathUtils.lerp(
                    trailMinSpeed,
                    trailMaxSpeed,
                    t * t
                )
            };
        }
    );

    // Assign each particle to a trail group
    const particleTrailGroups = new Uint8Array(
        particleCount
    );

    for (let i = 0; i < particleCount; i++) {

        const half = Math.floor(trailGroupCount / 2);

        particleTrailGroups[i] =
            Math.random() < 0.65
                ? half + Math.floor(Math.random() * half)
                : Math.floor(Math.random() * half);
    }

    function updateElasticPull(deltaTime) {

        // Calculate visible world dimensions
        const viewHeight =
            2 *
            Math.tan(
                THREE.MathUtils.degToRad(camera.fov / 2)
            ) *
            camera.position.z;

        const viewWidth =
            viewHeight * camera.aspect;

        // Convert hand displacement to world coordinates
        pullTarget.set(
            pullOffsetX * viewWidth,
            pullOffsetY * viewHeight,
            0
        );

        // Limit maximum displacement
        pullTarget.clampLength(
            0,
            maxPullDistance
        );

        // Spring displacement
        pullDisplacement.subVectors(
            pullTarget,
            particles.position
        );

        // Apply spring acceleration
        const springStrength =
            isPulling ? pullSpringStrength : 25;

        pullVelocity.addScaledVector(
            pullDisplacement,
            springStrength * deltaTime
        );

        // Apply damping
        const damping =
            isPulling ? pullDamping : 7;

        pullVelocity.multiplyScalar(
            Math.exp(-damping * deltaTime)
        );
        // Update sphere position
        particles.position.addScaledVector(
            pullVelocity,
            deltaTime
        );
    }

    function updatePullTrail(deltaTime) {

        // Prioritize explosion animation
        if (
            explosionAge < explosionDuration ||
            burstWasActive
        ) {
            trailWasActive = false;
            return;
        }

        // Initialize trail when pulling starts
        if (isPulling && !trailWasActive) {

            for (const group of trailGroups) {
                group.position.copy(particles.position);
            }

            trailWasActive = true;
        }

        if (!trailWasActive) return;

        // Convert world direction to local direction
        inverseRotation
            .copy(particles.quaternion)
            .invert();

        let maxLag = 0;

        // Update each trail group
        for (const group of trailGroups) {

            const smoothFactor =
                1 - Math.exp(-group.speed * deltaTime);

            group.position.lerp(
                particles.position,
                smoothFactor
            );

            group.offset.subVectors(
                group.position,
                particles.position
            );

            const lagDistance = group.offset.length();

            maxLag = Math.max(maxLag, lagDistance);

            // Taper the trailing particle formation
            const taper = THREE.MathUtils.smoothstep(
                lagDistance,
                0.15,
                2.5
            );

            group.shapeScale = THREE.MathUtils.lerp(
                1,
                0.5,
                taper
            );

            group.offset
                .applyQuaternion(inverseRotation)
                .multiplyScalar(
                    pullTrailStrength / particles.scale.x
                );
        }

        // Deform particle formation
        for (let i = 0; i < particleCount; i++) {

            const index = i * 3;

            const group =
                trailGroups[particleTrailGroups[i]];

            const offset = group.offset;
            const shapeScale = group.shapeScale;

            positions[index] =
                originalPositions[index] * shapeScale
                + offset.x;

            positions[index + 1] =
                originalPositions[index + 1] * shapeScale
                + offset.y;

            positions[index + 2] =
                originalPositions[index + 2] * shapeScale
                + offset.z;
        }

        // Restore sphere when everything settles
        if (
            !isPulling &&
            maxLag < 0.01 &&
            particles.position.length() < 0.01 &&
            pullVelocity.length() < 0.01
        ) {

            positions.set(originalPositions);

            trailWasActive = false;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    // 9. Animation loop
    let lastTime = null;

    renderer.setAnimationLoop((time) => {

        const deltaTime = lastTime === null
            ? 0
            : Math.min((time - lastTime) / 1000, 0.05);

        lastTime = time;

        // Particle rotation
        // Automatic rotation when manual mode is inactive
        // Continuous fast rotation
        if (isFastRotating) {

            targetRotationY +=
                fastDirectionX * fastRotationSpeed * deltaTime;

            targetRotationX +=
                fastDirectionY * fastRotationSpeed * deltaTime;

        } else if (!isRotating && !isPulling) {

            // Default automatic rotation
            targetRotationY += 0.2 * deltaTime;
            targetRotationX += 0.1 * deltaTime;
        }

        // Smooth manual rotation
        const rotationSmoothFactor =
            1 - Math.exp(-12 * deltaTime);

        particles.rotation.x = THREE.MathUtils.lerp(
            particles.rotation.x,
            targetRotationX,
            rotationSmoothFactor
        );

        particles.rotation.y = THREE.MathUtils.lerp(
            particles.rotation.y,
            targetRotationY,
            rotationSmoothFactor
        );

        // Smooth scale transition
        const isExploding =
            explosionAge < explosionDuration;

        const scaleSpeed = isExploding ? 18 : 5;

        const smoothFactor =
            1 - Math.exp(-scaleSpeed * deltaTime);

        const currentScale = THREE.MathUtils.lerp(
            particles.scale.x,
            targetScale,
            smoothFactor
        );

        particles.scale.setScalar(currentScale);

        updateElasticPull(deltaTime);

        updateExplosion(deltaTime);

        updatePullTrail(deltaTime);

        composer.render();
    });

    // 10. Responsive resizing
    const observer = new ResizeObserver(() => {

        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);
    });

    observer.observe(container);
}