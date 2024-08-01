// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  extractFrames: (videoPath: string) =>
    ipcRenderer.invoke("extract-frames", videoPath),
  getFrameFiles: (framesDir: string) =>
    ipcRenderer.invoke("get-frame-files", framesDir),
  getFrameData: (framePath: string) =>
    ipcRenderer.invoke("get-frame-data", framePath),
});
