const readline = require('readline');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

const downloadImage = async (url, filepath) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer', // Download as binary data
    });

    fs.writeFileSync(filepath, response.data);
    return filepath;
  } catch (err) {
    throw new Error(`Failed to download image: ${err.message}`);
  }
};

(async () => {
  try {
    console.log('Welcome to the Scraper CLI');

    // Prompt for inputs
    const reg = await askQuestion('Enter the aircraft registration (reg): ');
    if (!reg) {
      console.error('Registration is required!');
      process.exit(1);
    }

    const photos = await askQuestion(
      'Enter the number of photos to fetch (default: 3): '
    );
    const flights = await askQuestion(
      'Enter the number of flights to fetch (default: 8): '
    );

    console.log('\nRunning scraper...\n');

    // Build the command
    const command = `node scraper.js ${reg} ${photos || ''} ${flights || ''}`.trim();

    // Execute the scraper script
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
      if (stderr) {
        console.error(`Error: ${stderr}`);
        process.exit(1);
      }

      console.log('Scraper Result:\n');

      const result = JSON.parse(stdout);
      console.log(JSON.stringify(result, null, 2));

      // Check if there are photos available
      if (result.jetPhotos && result.jetPhotos.photos && result.jetPhotos.photos.length > 0) {
        for (const photo of result.jetPhotos.photos) {
          const photoId = path.basename(photo.link).split('-').pop(); // Extract photo ID
          const filePath = path.join(__dirname, `${photoId || 'temp-photo'}.jpg`);

          console.log(`Downloading photo with ID ${photoId} from: ${photo.link}`);

          try {
            await downloadImage(photo.link, filePath);
            console.log(`Photo saved as: ${filePath}`);
          } catch (downloadErr) {
            console.error('Error downloading the photo:', downloadErr.message);
          }
        }
      } else {
        console.log('No photos available for this registration.');
      }

      rl.close();
    });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    rl.close();
    process.exit(1);
  }
})();
