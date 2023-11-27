const { readdir } = require("node:fs/promises");
import * as fs from 'fs';
import * as path from "path"
var exec = require('child_process').exec;

//settings
let allowedType = [".mp4",".webm",".mkv"]
var isWin = process.platform === "win32";

//variables
var files: String[] = require('./files.json')
let scannedFiles: String[] = []
let newFiles: String[] = []
let msgbody = "";



const execPromise = function(cmd:string) {
  return new Promise(function(resolve, reject) {
    log(`Executing: "${cmd}"`)
      exec(cmd, function(err:any, stdout:string) {
          if (err) return reject(err);
          resolve(stdout);
      });
  });
}

const log = (msg: string) => {
  console.log(msg)
  msgbody += msg + "\n"
}

async function getFiles(dir: string) {
  const files: fs.Dirent[] = await readdir(dir, { recursive: true, withFileTypes: true });
  await Promise.all(files.map(async (file) => {
    if (file.isFile()) {
      if (allowedType.includes(path.extname(file.name))) {
        scannedFiles.push(path.join(dir, file.name))
      }
    } else {
      let d = path.join(dir, file.name)
      await getFiles(d)
    }

  }))
}

const startUp = async () => {
  log("Starting a scan")
  await getFiles(__dirname)
  log(`Scan has done with **${scannedFiles.length}** files.`)
  scannedFiles.map((file) => {
    if (!files.includes(file)) {
      newFiles.push(file)
    }
  })
  log(`**${newFiles.length}** new files found.`)
  if (newFiles.length > 0) {
    let combined = files.concat(newFiles)
    fs.writeFileSync("files.json", JSON.stringify(combined))
  }
  sendMessage()
  convertNews()
}

const convertNews = async () => {
  newFiles.map(async(file)=>{
    let p = path.dirname(file as string)
    let container = path.extname(file as string)
    let newfile = (path.basename(file as string)).replace(container,"") + ".mp4"
    let output = path.join(p,newfile)
    let cmd = ""
    if(isWin) {
      let cmd = `HandBrakeCLI -i "${file}" -o "${output}" -e x264 --preset "Very Fast 1080p30"`
    } else {
      let cmd = `HandBrakeCLI -i "${file}" -o "${output}" -e x264 --preset "Very Fast 1080p30"`
    }
    
    //let cmd = `ffmpeg -i "${file}" -c:v libx264 -b:v 2600k -vf format=yuv420p -movflags +faststart -c:a aac -b:a 128k "${output}"`
    await execPromise(cmd)
    fs.unlinkSync(file as string);
    log(`Conversation has done for ${newfile}`)
    sendMessage()
  })
}

const sendMessage = () => {
  fetch('https://ntfy.sh/55oarican_network', {
    method: 'POST',
    body: msgbody,
    headers: {
      'Title': 'MediaServer Transcode',
      'Tags': 'video_camera',
      'Markdown': 'yes'
    }
  }).then(async (res) => {
    console.log(await res.text())
    msgbody = ""
  })
}

startUp()
