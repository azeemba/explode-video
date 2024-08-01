/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

// import './index.css';
const selectVideoBtn = document.getElementById(
  "selectVideo"
) as HTMLButtonElement;
const frameDisplay = document.getElementById("frameDisplay") as HTMLDivElement;
const frameSlider = document.getElementById("frameSlider") as HTMLInputElement;
const frameNumber = document.getElementById("frameNumber") as HTMLInputElement;
const totalFrames = document.getElementById("totalFrames") as HTMLSpanElement;
const overlay = document.getElementById("overlay") as HTMLDivElement;

function showOverlay() {
  overlay.style.display = "flex";
  console.log(overlay, overlay.style)
}

function hideOverlay() {
  overlay.style.display = "none";
  console.log(overlay, overlay.style)
}

let currentFrames: string[] = [];
let currentFrameIndex = 1;

selectVideoBtn.addEventListener("click", async () => {
  const videoPath = await window.electronAPI.openFileDialog();
  if (videoPath) {
    showOverlay();
    const framesDir = await window.electronAPI.extractFrames(videoPath);
    await loadFrames(framesDir);
    hideOverlay();
  }
});

async function loadFrames(framesDir: string) {
  frameDisplay.innerHTML = "";
  const frameFiles = await window.electronAPI.getFrameFiles(framesDir);
  currentFrames = frameFiles.map((file) => `${framesDir}/${file}`);

  updateSliderAndInput(currentFrames.length);
  await displayFrame(1);

  frameSlider.addEventListener("input", async () => {
    currentFrameIndex = parseInt(frameSlider.value);
    await displayFrame(currentFrameIndex);
    frameNumber.value = currentFrameIndex.toString();
  });

  frameNumber.addEventListener("change", async () => {
    currentFrameIndex = Math.max(
      1,
      Math.min(parseInt(frameNumber.value), currentFrames.length)
    );
    await displayFrame(currentFrameIndex);
    frameSlider.value = currentFrameIndex.toString();
    frameNumber.value = currentFrameIndex.toString();
  });

  // Add keyboard event listener
  document.addEventListener("keydown", handleKeyPress);
}

async function displayFrame(frameIndex: number) {
  console.log("Will load: ", frameIndex);
  if (frameIndex < 1 || frameIndex > currentFrames.length) return;

  const framePath = currentFrames[frameIndex - 1];
  console.log("Will load: ", framePath);
  const frameData = await window.electronAPI.getFrameData(framePath);

  frameDisplay.innerHTML = "";
  const img = document.createElement("img");
  img.src = frameData;
  frameDisplay.appendChild(img);

  currentFrameIndex = frameIndex;
  frameSlider.value = frameIndex.toString();
  frameNumber.value = frameIndex.toString();
}

function updateSliderAndInput(totalFrameCount: number) {
  frameSlider.max = totalFrameCount.toString();
  frameSlider.value = "1";
  frameNumber.max = totalFrameCount.toString();
  frameNumber.value = "1";
  totalFrames.textContent = `/ ${totalFrameCount}`;
}

function handleKeyPress(event: KeyboardEvent) {
  switch (event.key) {
    case "ArrowLeft":
      navigateFrames(-1);
      break;
    case "ArrowRight":
      navigateFrames(1);
      break;
  }
}

async function navigateFrames(direction: number) {
  const newIndex = Math.max(
    1,
    Math.min(currentFrameIndex + direction, currentFrames.length)
  );
  if (newIndex !== currentFrameIndex) {
    await displayFrame(newIndex);
  }
}
