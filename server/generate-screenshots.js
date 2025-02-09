import puppeteer from 'puppeteer';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

// Helper function to convert a string to kebab-case
function toKebabCase(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function generateScreenshots(urls, outputDir = 'public/images') { // changed default output directory
  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const browser = await puppeteer.launch(); // { headless: false } to see the browser
  const page = await browser.newPage();

  for (const url of urls) {
    try {
      // Use helper for kebab-case filename
      const filename = `${outputDir}/${toKebabCase(url)}.png`;

      // 2. Navigate to the URL
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); // Adjust timeout as needed

      // Check for successful navigation (status code 200-399)
      if (!response.ok()) {
        console.error(`Error navigating to ${url}: Status code ${response.status()}`);
        continue; // Skip to the next URL
      }

      // Set viewport size (adjust as needed)
      await page.setViewport({ width: 1280, height: 800 }); // Desktop size

      // 3. Take the screenshot (desktop)
      await page.screenshot({ path: filename });
      console.log(`Screenshot saved for ${url} as ${filename}`);


      // Mobile screenshot (optional - adjust viewport)
      await page.setViewport({ width: 375, height: 812, isMobile: true }); // iPhone X size
      const mobileFilename = `${outputDir}/${toKebabCase(url)}-mobile.png`;
      await page.screenshot({ path: mobileFilename });
      console.log(`Mobile screenshot saved for ${url} as ${mobileFilename}`);


    } catch (error) {
      console.error(`Error generating screenshot for ${url}:`, error);
    }
  }

  await browser.close();
}

// If you want to read URLs from a file:

async function generateScreenshotsFromFile(filePath, outputDir = 'screenshots') {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    const urls = data.split('\n').filter(url => url.trim() !== ''); // Split by lines and remove empty lines
    await generateScreenshots(urls, outputDir);
  } catch (err) {
    console.error('Error reading URL file:', err);
  }
}

// New function to generate screenshots from a JSON file containing objects with "name" and "url"
async function generateScreenshotsFromJson(jsonPath, outputDir = 'public/images') {
  try {
    const jsonText = await fsPromises.readFile(jsonPath, 'utf8');
    const data = JSON.parse(jsonText); // expecting: [{ "name": "example", "url": "https://www.example.com" }, ...]

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const item of data) {
      try {
        const filename = `${outputDir}/${toKebabCase(item.name)}.png`;

        const response = await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 60000 });
        if (!response.ok()) {
          console.error(`Error navigating to ${item.url}: Status code ${response.status()}`);
          continue;
        }

        await page.setViewport({ width: 1280, height: 800 });
        await page.screenshot({ path: filename });
        console.log(`Screenshot saved for ${item.url} as ${filename}`);

        // await page.setViewport({ width: 375, height: 812, isMobile: true });
        // const mobileFilename = `${outputDir}/${toKebabCase(item.name)}-mobile.png`;
        // await page.screenshot({ path: mobileFilename });
        // console.log(`Mobile screenshot saved for ${item.url} as ${mobileFilename}`);
      } catch (error) {
        console.error(`Error generating screenshot for ${item.url}:`, error);
      }
    }
    await browser.close();
  } catch (err) {
    console.error('Error reading JSON file:', err);
  }
}

// Remove previous example usages and add CLI parsing
const args = process.argv.slice(2);
// Change default mode to "json"
let mode = 'json';
args.forEach(arg => {
  if (arg.startsWith('--mode=')) {
    mode = arg.split('=')[1];
  }
});

// Sample URLs array (for mode "urls")
const urls = [
  'https://www.example.com',
  'https://www.google.com',
  'https://www.wikipedia.org'
  // ... your list of URLs
];

(async function() {
  switch(mode) {
    case 'json':
      await generateScreenshotsFromJson('screenshots.json');
      break;
    case 'file':
      await generateScreenshotsFromFile('urls.txt');
      break;
    case 'urls':
    default:
      await generateScreenshots(urls);
  }
})();
