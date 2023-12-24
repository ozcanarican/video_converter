const { readdir } = require("node:fs/promises");
import * as fs from 'fs';
import * as path from "path"
import  {DateTime}  from "luxon";
import { exec, execSync } from 'child_process';
import { Request, Response } from 'express';
const express = require('express')

//settings
const videoFolder = "D:/multimedia"
let allowedType = [".mp4",".webm",".mkv",".avi"]
var isWin = process.platform === "win32";
const deleteOldFile = false
const app = express()
const port = 3333

//variables
let files_location = path.join(__dirname,'files.json')
var files: string[] = require(files_location)
let scannerDirs:string[] = []
let scannedFiles: string[] = []
let newFiles: string[] = []
let msgbody = "";
let isRunning = false
let currentIndex = 0


const log = (msg: string) => {
  console.log(msg)
  msgbody += msg + "\n"
}

const addToData = async(file:string) => {
  let filesData = JSON.parse(fs.readFileSync(files_location, 'utf8'));
  if (!filesData.includes(file)) {
    filesData.push(file)
    fs.writeFileSync(files_location, JSON.stringify(filesData))
  }
}


async function getFiles(dir: string) {
  if(scannerDirs.includes(dir)) {
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
  files = await JSON.parse(fs.readFileSync(files_location,"utf-8"))
  log("Starting a scan")
  await getFiles(videoFolder)
  log(`Scan has done with **${scannedFiles.length}** files.`)
  scannedFiles.map((file) => {
    if (!files.includes(file)) {
      if(!newFiles.includes(file)) {
        log(`Feature task: ${file}`)
        newFiles.push(file)
      }
    }
  })
  if(newFiles.length > 0 && !isRunning) {
    isRunning = true
    convertNews()
    log(`**${newFiles.length}** new files found.`)
  }
  
}

const convertNews = async () => {
  console.log("Conversation has been started")
  if(currentIndex < newFiles.length) {
    isRunning = true
    let file = newFiles[currentIndex]
    currentIndex++;
    let child = exec(`node C:\\Users\\ozcan\\video_converter\\converter.js "${file}"`)
    child.on('close', function(code) {
      files.push(file)
      fs.writeFileSync(files_location, JSON.stringify(files))
      convertNews()
     });
  } else {
    isRunning = false
  }
}

const sendMessage = async(title:string, icon:string='video_camera') => {
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
  msgbody = ""
}



app.get("/",(req:Request,res:Response)=>{
  if(!isRunning) {
    let kac = startUp()
    res.send(`Started to scan`)
  } else {
    res.send("Already running")
  }
  
})
app.listen(port,()=>{
  console.log("Listening port: " + port)
})
//startUp()
