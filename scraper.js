const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Middleware for JSON responses
app.use(express.json());

// Helper to fetch HTML
const fetchHTML = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    return cheerio.load(data);
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${url} - ${err.message}`);
  }
};

// JetPhotos scraper
const scrapeJetPhotos = async (reg, photoCount = 3) => {
  const baseURL = `https://www.jetphotos.com/photo/keyword/${reg}`;
  const $ = await fetchHTML(baseURL);

  const results = [];
  $('a.result__photoLink').each((i, elem) => {
    if (i >= photoCount) return false;
    const link = $(elem).attr('href');
    const thumbnail = $(elem).find('img.result__photo').attr('src');

    results.push({
      link: `https://www.jetphotos.com${link}`,
      thumbnail,
    });
  });

  return { reg, photos: results };
};

// FlightRadar scraper
const scrapeFlightRadar = async (reg, flightCount = 8) => {
  const baseURL = `https://www.flightradar24.com/data/aircraft/${reg}`;
  const $ = await fetchHTML(baseURL);

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

  return { reg, flights };
};

// Function to process input and fetch data
const processRequest = async (reg, photos, flights) => {
  if (!reg) {
    throw new Error('Aircraft registration (reg) is required');
  }

  const [jetPhotosData, flightRadarData] = await Promise.all([
    scrapeJetPhotos(reg, parseInt(photos, 10) || 3),
    scrapeFlightRadar(reg, parseInt(flights, 10) || 8),
  ]);

  return {
    jetPhotos: jetPhotosData,
    flightRadar: flightRadarData,
  };
};

// Run the API locally only when invoked
(async () => {
  const reg = process.argv[2];
  const photos = process.argv[3];
  const flights = process.argv[4];

  if (!reg) {
    console.error('Usage: node script.js <reg> [photos] [flights]');
    process.exit(1);
  }

  try {
    const result = await processRequest(reg, photos, flights);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
