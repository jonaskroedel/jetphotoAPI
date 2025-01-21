const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const scrapePage = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const startTime = Date.now();

    // Set user-agent to mimic a real browser
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Block CSS to reduce load time
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet') req.abort();
      else req.continue();
    });

    // Go to the URL and wait for network activity to idle
    await page.goto(url, { waitUntil: 'networkidle2' });

    const content = await page.content(); // Extract HTML content

    const responseTime = Date.now() - startTime;
    fs.appendFileSync('flightRadar.log', `Response time: ${responseTime}ms\n`);

    await browser.close();
    return content;
  } catch (err) {
    fs.appendFileSync('flightRadar.log', `Error scraping ${url}: ${err.message}\n`);
    await browser.close();
    throw err;
  }
};

// JetPhotos scraper
const scrapeJetPhotos = async (reg) => {
  const url = `https://www.jetphotos.com/photo/keyword/${reg}`;
  const html = await scrapePage(url);

  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  const firstPhoto = $('a.result__photoLink').first();
  const link = firstPhoto.attr('href');
  const thumbnail = firstPhoto.find('img.result__photo').attr('src');
  const id = link.split('/').pop(); // Extract unique photo ID

  // Save the first image to ./images with its unique ID
  const imagePath = path.join(__dirname, 'images', `${id}.jpg`);
  if (!fs.existsSync('./images')) fs.mkdirSync('./images');

  const fullImageUrl = `https:${thumbnail.replace('/400/', '/full/')}`;
  try {
    const file = fs.createWriteStream(imagePath);
    await new Promise((resolve, reject) => {
      https.get(fullImageUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', (err) => {
        fs.appendFileSync('flightRadar.log', `Error downloading image: ${err.message}\n`);
        reject(err);
      });
    });
  } catch (err) {
    fs.appendFileSync('flightRadar.log', `Error saving image: ${err.message}\n`);
  }

  return {
    reg,
    photos: [
      {
        link: `https://www.jetphotos.com${link}`,
        fullsizeUrl: fullImageUrl,
        thumbnail,
        id,
      },
    ],
  };
};

// FlightRadar scraper
const scrapeFlightRadar = async (reg, flightCount = 8) => {
  const url = `https://www.flightradar24.com/data/aircraft/${reg}`;
  const html = await scrapePage(url);

  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  const flights = [];
  $('table#tbl-datatable tbody tr').each((i, elem) => {
    if (i >= flightCount) return false;
    const cols = $(elem).find('td');
    flights.push({
      date: $(cols[0]).text().trim(),
      from: $(cols[1]).text().trim(),
      to: $(cols[2]).text().trim(),
      flight: $(cols[3]).text().trim(),
      flightTime: $(cols[4]).text().trim(),
    });
  });

  // Log FlightRadar data to a file
  const logPath = path.join(__dirname, 'flightRadar.log');
  fs.appendFileSync(logPath, `Reg: ${reg}\n${JSON.stringify(flights, null, 2)}\n\n`);

  return { reg, flights };
};

// Combine results
const processRequest = async (reg, photos, flights) => {
  if (!reg) {
    throw new Error('Aircraft registration (reg) is required');
  }

  const [jetPhotosData, flightRadarData] = await Promise.all([
    scrapeJetPhotos(reg),
    scrapeFlightRadar(reg, parseInt(flights, 10) || 8),
  ]);

  return {
    jetPhotos: jetPhotosData,
    flightRadar: flightRadarData,
  };
};

// CLI Execution
(async () => {
  const reg = process.argv[2];
  const photos = process.argv[3];
  const flights = process.argv[4];

  if (!reg) {
    fs.appendFileSync('flightRadar.log', 'Usage: node scraper.js <reg> [photos] [flights]\n');
    process.exit(1);
  }

  try {
    const result = await processRequest(reg, photos, flights);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    fs.appendFileSync('flightRadar.log', `Error: ${err.message}\n`);
    process.exit(1);
  }
})();
