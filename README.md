<div align="center">

# ⋆｡°✩ Stardust

**Gesture-controlled particle system — Hazellenuts**

*A little universe at your fingertips.*

![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

[**✦ Explore Stardust — Live Demo**](https://stardust-hazellenuts.vercel.app/)

</div>

## ✦ About

Stardust is an interactive 3D particle system that lets you manipulate a collection of 5,000 glowing particles using hand gestures in real time. Condense, expand, rotate, pull, and scatter particles with nothing but your hands and a webcam.

Built as a creative experiment in computer vision, gesture recognition, and interactive graphics.

## ✦ User Manual

Open the live demo, select your camera, click **Start Camera**, and allow camera access. Keep your hands visible to the webcam.

Gestures are listed in **left hand — right hand** order.

| Left hand | Right hand | Interaction |
| :---: | :---: | :--- |
| 🫳 / 🚫 | 🫳 / 🚫 | Neutral / default rotation |
| 🚫 | ✊ | Condense |
| 🚫 | ✋ | Expand |
| ☝️ | ✋ | Manual rotation |
| ✌️ | ✋ | Continuous fast rotation |
| 3️⃣ | ✋ | Elastic pull & particle trail |
| ✊ | ✊ | Energy charge |
| ✋ | ✋ | Expand / reset fast rotation |
| ✊✊ → ✋✋ | Both hands | Supernova burst |

- **Manual rotation:** Move your left index finger to rotate the particles.

- **Continuous fast rotation:** Point your left index and middle fingers in the desired direction. The rotation continues even after you release the gesture, until another control gesture overrides it.

- **Elastic pull:** Extend your left index, middle, and ring fingers. Move your hand to pull the particles and create a trail. Release to let them return to the center.

- **Supernova burst:** Close both hands to charge, then open both hands to release the particles. Watch them slowly return to their original formation.

`🚫` = No hand detected  
`🫳` = Neutral hand  
`3️⃣` = Three extended fingers

> The neutral gesture returns the system to its default state when continuous rotation is not active. Close your right hand or open both hands to reset continuous fast rotation.

## ✦ Built With

- **Three.js** — 3D particle rendering, animation, and bloom effects.
- **MediaPipe Hand Landmarker** — Real-time hand tracking and landmark extraction.
- **JavaScript** — Gesture recognition and interaction logic.
- **Vite** — Development server and production build tooling.
- **HTML & CSS** — Interface and layout.

## ✦ Run Locally

With a compatible version of Node.js installed, open a terminal in the project directory and run:

```bash
npm install
npm run dev
```

Open the local URL displayed in the terminal.

To create a production build:

```bash
npm run build
```

## ✦ Camera & Privacy

Hand tracking runs locally in the browser. Stardust requires camera permission to recognize gestures; its gesture-processing code does not upload webcam footage to a server.

For the best experience, use a desktop or laptop with a webcam and good lighting.

---

<div align="center">

Made with curiosity and a little stardust by **Hazellenuts**. ✦

</div>
