const { launch, getStream } = require('puppeteer-stream')
const { exec } = require('child_process')

// puppeteer stream + FFmpeg example: https://github.com/Flam3rboy/puppeteer-stream/blob/main/examples/ffmpeg.js

const ffmpegConfig = (twitch) => {
  return `ffmpeg -i - -v error -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -strict -2 -ar 44100 -b:a 64k -y -use_wallclock_as_timestamps 1 -async 1 -bufsize 1000 -f flv ${twitch}`
}

let twitch =
  'rtmps://dc4-1.rtmp.t.me/s/1714692839:9KI2gwSXzfuL3JI65HtbyQ'

async function test() {
  const browser = await launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  })

  const page = await browser.newPage()
  await page.goto('https://nuto.education')
  const stream = await getStream(page, {
    audio: true,
    video: true,
    frameSize: 1000,
  })
  console.log('recording')
  // this will pipe the stream to ffmpeg and convert the webm to mp4 format
  const ffmpeg = exec(ffmpegConfig(twitch))

  ffmpeg.stderr.on('data', (chunk) => {
    console.log(chunk.toString())
  })

  stream.pipe(ffmpeg.stdin)

  setTimeout(async () => {
    await stream.destroy()
    stream.on('end', () => {
      console.log('stream has ended')
    })
    ffmpeg.stdin.setEncoding('utf8')
    ffmpeg.stdin.write('q')
    ffmpeg.stdin.end()
    ffmpeg.kill()

    console.log('finished')
  }, 1000 * 40)
}

test()
