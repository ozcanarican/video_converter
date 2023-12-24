const { readdir } = require("node:fs/promises");
import * as fs from 'fs';
import * as path from "path"
import { DateTime } from "luxon";
import { exec, execSync } from 'child_process';
const process = require("process")

let file:string = process.argv[2]
//variables
let files_location = path.join(__dirname,'files.json')
var files: string[] = require(files_location)
let msgbody = "";

const log = (msg: string) => {
    console.log(msg)
    msgbody += msg + "\n"
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

const convertNews = async () => {
    let startTime = DateTime.now()
    log("Converting " + file)
    await sendMessage("MediaServer Transcode","file_folder")
    let p = path.dirname(file as string)
    let container = path.extname(file as string)
    let newfile = (path.basename(file as string)).replace(container, "") + ".mp4"
    let output = path.join(p, newfile)
    let temp = path.join(p, "temp.transcode")
    if (fs.existsSync(temp)) {
        fs.rmSync(temp)
    }
    let cmd = `HandBrakeCLI -i "${file}" -o "${temp}" -e x264 --preset "Very Fast 1080p30"`
    execSync(cmd)
    fs.unlinkSync(file as string);
    fs.renameSync(temp, output)
    let fark = DateTime.now().diff(startTime)
    log(`Conversation has done for ${newfile} (${fark.toFormat("mm:ss")})`)
    await sendMessage("MediaServer Transcode","file_folder")
}
convertNews()


