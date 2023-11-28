const { readdir } = require("node:fs/promises");
import * as fs from 'fs';
import * as path from "path"
import  {DateTime}  from "luxon";
import { exec, execSync } from 'child_process';

//settings
const videoFolder = "D:/multimedia"
let allowedType = [".mp4",".webm",".mkv",".avi"]
var isWin = process.platform === "win32";
const deleteOldFile = true

//variables
let files_location = path.join(__dirname,'files.json')
var files: string[] = require(files_location)
let scannerDirs:string[] = []
let scannedFiles: string[] = []
let newFiles: string[] = []
let msgbody = "";


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
  log("Starting a scan")
  await getFiles(videoFolder)
  log(`Scan has done with **${scannedFiles.length}** files.`)
  scannedFiles.map((file) => {
    if (!files.includes(file)) {
      newFiles.push(file)
    }
  })
  log(`**${newFiles.length}** new files found.`)
  
  if (newFiles.length > 0) {
    await sendMessage("MediaServer New Files")
    let combined = files.concat(newFiles)
    fs.writeFileSync(files_location, JSON.stringify(combined))
    convertNews()
  }
}

const convertNews = async () => {
  console.log("Conversation has been started")
  await Promise.all(
    newFiles.map(async(file)=>{
      let startTime = DateTime.now()
      console.log("Converting " + file)
      let p = path.dirname(file as string)
      let container = path.extname(file as string)
      let newfile = (path.basename(file as string)).replace(container,"") + ".mp4"
      let output = path.join(p,newfile)
      let temp = path.join(p,"temp.transcode")
      if(fs.existsSync(temp)) {
        fs.rmSync(temp)
      }
      let cmd = ""
      if(isWin) {
        cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`
      } else {
        cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`
      }
      execSync(cmd)
      if(deleteOldFile) {
        fs.unlinkSync(file as string);
      } else {
        fs.renameSync(file,file + ".old")
        addToData(file + ".old")
      }
      fs.renameSync(temp,output)
      addToData(output)
      let fark = DateTime.now().diff(startTime)
      log(`Conversation has done for ${newfile} (${fark.toFormat("mm:ss")})`)
    })
  )
  await sendMessage("MediaServer Transcode","file_folder")
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

startUp()
