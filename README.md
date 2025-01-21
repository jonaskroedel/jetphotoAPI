# JetPhotos Scraper API
A simple tool to scrape JetPhotos and FlightRadar24 data using Node.js. It provides an API endpoint (work in progress) and a CLI tool (caller.js) for interactive data retrieval.

## Features
- Fetch JetPhotos data (aircraft images) based on registration.
- Fetch flight data from FlightRadar24.
- Save images with unique IDs.
- Designed to be extendable and easy to deploy.
## Setup
### Prerequisites
- Node.js (v14 or higher).
- Internet connection.
### Installation
1. Clone the repository or download the files.
2. Navigate to the project directory.
3. Install dependencies:
```bash
npm install
```
## Usage
### API Endpoint
#### Work in Progress

This will provide a deployable serverless API for fetching data.

## CLI Tool
Run the caller.js file for interactive data retrieval:

```bash
node caller.js
```
#### Steps:
1. Follow the prompts to provide:
- Aircraft registration (e.g., abcd1234).
- Number of photos to fetch (optional, default: 3).
- Number of flights to fetch (optional, default: 8).
2. The scraper retrieves the data and saves images in the current directory.
## Known Issues
- Corrupted Images: Images downloaded are broken due to incorrect handling of the response. A fix is being implemented to ensure proper image download.
## Roadmap
- [x]  CLI implementation (caller.js).
- [ ]  Fix image download issues.
- [ ]  Finalize the API endpoint.
- [ ]  Add deployment support for serverless platforms.
## Contributing
1. Fork the repository.
2. Create a feature branch:
```bash
git checkout -b feature-name
```
3. Commit changes and push:
```bash
git push origin feature-name
```
4. Submit a pull request.
## License
MIT License. See LICENSE file for details.