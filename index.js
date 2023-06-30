const { launch, getStream } = require('puppeteer-stream')
const child_process = require('child_process')
const {exec} = require('child_process')

const getExecutablePath = () => {
  if (process.env.CHROME_BIN) {
    return process.env.CHROME_BIN;
  }

  let executablePath;
  if (process.platform === 'linux') {
    try {
      executablePath = child_process.execSync('which chromium-browser').toString().split('\n').shift();
    } catch (e) {
      // NOOP
    }

    if (!executablePath) {
      executablePath = child_process.execSync('which chromium').toString().split('\n').shift();
      if (!executablePath) {
        throw new Error('Chromium not found (which chromium)');
      }
    }
  } else if (process.platform === 'darwin') {
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (process.platform === 'win32') {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else {
    throw new Error('Unsupported platform: ' + process.platform);
  }

  return executablePath;
};

// puppeteer stream + FFmpeg example: https://github.com/Flam3rboy/puppeteer-stream/blob/main/examples/ffmpeg.js

const ffmpegConfig = (twitch) => {
  return `ffmpeg -i - -v error -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -strict -2 -ar 44100 -b:a 64k -y -use_wallclock_as_timestamps 1 -async 1 -bufsize 1000 -f flv ${twitch}`
}

let twitch =
  'rtmps://dc4-1.rtmp.t.me/s/1714692839:9KI2gwSXzfuL3JI65HtbyQ'

async function test() {
  const browser = await launch({
    executablePath: getExecutablePath(),
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

  const page = await browser.newPage()
  await page.goto('https://nuto.education')
  const stream = await getStream(page, {
    audio: true,
    video: true,
    frameSize: 30,
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
