const { readdir } = require("node:fs/promises");
import * as fs from 'fs';
import * as path from "path"
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { execSync } from 'child_process';
import { DateTime } from 'luxon';
const express = require('express')

//settings
const videoFolder = "/mnt/usb1/multimedia"
let allowedType = [".mp4", ".webm", ".mkv", ".avi"]
var isWin = process.platform === "win32";
const deleteOldFile = false
const app = express()
const port = 3333

//variables
let files_location = path.join(__dirname, 'files.json')
var files: string[] = require(files_location)
let scannerDirs: string[] = []
let scannedFiles: string[] = []
let newFiles: string[] = []
let msgbody = "";
let isRunning = false
let index = 0


const log = (msg: string) => {
  console.log(msg)
  msgbody += msg + "\n"
}

const addToData = async (file: string) => {
  let filesData = JSON.parse(fs.readFileSync(files_location, 'utf8'));
  if (!filesData.includes(file)) {
    filesData.push(file)
    fs.writeFileSync(files_location, JSON.stringify(filesData))
  }
}


async function getFiles(dir: string) {
  if (scannerDirs.includes(dir)) {
    return
  }
  scannerDirs.push(dir)
  const files: fs.Dirent[] = await readdir(dir, { recursive: true, withFileTypes: true });
  await Promise.all(files.map(async (file) => {
    if (file.isFile() && !scannedFiles.includes((path.join(file.path, file.name))) && file.name != "temp.mp4") {
      if (allowedType.includes(path.extname(file.name))) {
        scannedFiles.push(path.join(file.path, file.name))
      }
    } else {
      await getFiles(file.path)
    }

  }))
}

const startUp = async () => {
  scannerDirs = []
  scannedFiles = []
  newFiles = []
  index = 0
  files = await JSON.parse(fs.readFileSync(files_location, "utf-8"))
  log("Starting a scan")
  await getFiles(videoFolder)
  log(`Scan has done with **${scannedFiles.length}** files.`)
  scannedFiles.map((file) => {
    if (!files.includes(file)) {
      if (!newFiles.includes(file)) {
        log(`Feature task: ${file}`)
        newFiles.push(file)
      }
    }
  })
  convertNews()
  log(`**${newFiles.length}** new files found.`)
}

const convertNews = async () => {
  console.log("Conversation has been started")
  files = [...files, ...newFiles]
  fs.writeFileSync(files_location, JSON.stringify(files))
  await sendMessage("MediaServer Transcode", "file_folder")
  if (newFiles.length > 0) {
    isRunning = true
    convert()
  }
}

const convert = async (): Promise<void> => {
  if(index >= files.length) {
    log("All proccess is done")
    await sendMessage("MediaServer Transcode", "file_folder")
    isRunning = false
    startUp()
  } else {
    let file:string = newFiles[index]
    let startTime = DateTime.now()
    log("Converting " + file)
    await sendMessage("MediaServer Transcode", "file_folder")
    let p = path.dirname(file as string)
    let container = path.extname(file as string)
    let newfile = (path.basename(file as string)).replace(container, "") + ".mp4"
    let output = path.join(p, newfile)
    let temp = path.join(p, "temp.transcode")
    if (fs.existsSync(temp)) {
      fs.rmSync(temp)
    }
    let cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`
    execSync(cmd, {stdio:"inherit"})
    fs.unlinkSync(file as string);
    fs.renameSync(temp, output)
    let fark = DateTime.now().diff(startTime)
    log(`Conversation has done for ${newfile} (${fark.toFormat("mm:ss")})`)
    await sendMessage("MediaServer Transcode", "file_folder")
    index++
    convert()
  }
}

const sendMessage = async (title: string, icon: string = 'video_camera') => {
  try {
    let res = await fetch('https://ntfy.sh/55oarican_network', {
      method: 'POST',
      body: msgbody,
      headers: {
        'Title': title,
        'Tags': icon,
        'Markdown': 'yes'
      }
    })
    console.log(await res.text())
  } catch (error) {
    console.log("notification error", error)
  }
  msgbody = ""
}

app.get("/", (req: Request, res: Response) => {
  if (!isRunning) {
    let kac = startUp()
    res.send(`Started to scan`)
  } else {
    res.send("Already running")
  }

})
app.listen(port, () => {
  console.log("Listening port: " + port)
  startUp()
})
