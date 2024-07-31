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

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

const selectVideoBtn = document.getElementById('selectVideo') as HTMLButtonElement
const frameContainer = document.getElementById('frameContainer') as HTMLDivElement

selectVideoBtn.addEventListener('click', async () => {
  const videoPath = await window.electronAPI.openFileDialog()
  if (videoPath) {
    const framesDir = await window.electronAPI.extractFrames(videoPath)
    await displayFrames(framesDir)
  }
})

async function displayFrames(framesDir: string) {
  frameContainer.innerHTML = ''
  const frameFiles = await window.electronAPI.getFrameFiles(framesDir)
  
  for (const file of frameFiles) {
    const framePath = `${framesDir}/${file}`
    const frameData = await window.electronAPI.getFrameData(framePath)
    
    const img = document.createElement('img')
    img.src = frameData
    img.style.width = '100px'
    img.style.height = 'auto'
    img.style.margin = '5px'
    frameContainer.appendChild(img)
  }
}
