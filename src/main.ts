import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.removeMenu();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  ipcMain.handle("open-file-dialog", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: "Videos", extensions: ["mp4", "avi", "mov"] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("extract-frames", async (event, videoPath) => {
    const framesDir = path.join(app.getPath("temp"), "extracted-frames");
    deleteDirectory(framesDir);
    await ensureDirectoryExists(framesDir);
    await extractFrames(videoPath, framesDir);
    return framesDir;
  });

  ipcMain.handle("get-frame-files", async (event, framesDir) => {
    return await getFrameFiles(framesDir);
  });

  ipcMain.handle("get-frame-data", async (event, framePath) => {
    return await getFrameData(framePath);
  });
  // Open the DevTools.
  //  mainWindow.webContents.openDevTools();
};

async function getFrameFiles(framesDir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(framesDir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          files
            .filter((file) => file.endsWith(".png"))
            .toSorted((a, b) => {
              const num_a = a.slice(6, -4);
              const num_b = b.slice(6, -4);
              return parseInt(num_a) - parseInt(num_b);
            })
        );
      }
    });
  });
}

async function getFrameData(framePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(framePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Data = data.toString("base64");
        resolve(`data:image/png;base64,${base64Data}`);
      }
    });
  });
}

function deleteDirectory(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true });
  }
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function extractFrames(
  videoPath: string,
  outputDir: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Will handle: ", videoPath);
    ffmpeg(videoPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .on("progress", (p) => console.log(p))
      .size("800x?")
      .output(`${outputDir}/frame-%d.png`)
      .run();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    const framesDir = path.join(app.getPath("temp"), "extracted-frames");
    deleteDirectory(framesDir);
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
