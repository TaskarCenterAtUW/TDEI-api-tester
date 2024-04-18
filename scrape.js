const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Get the path to the current directory
    const currentDir = process.cwd();

    // Specify the path to the report.html file relative to the current directory
    const reportFilePath = path.join(currentDir, 'test-report.html');

    // Load the report.html file
    const fileUrl = `file://${reportFilePath}`;
    await page.goto(fileUrl);

    // Extract HTML content
    const htmlContent = await page.content();

    // Write the scraped content to a new HTML file
    fs.writeFileSync('test-report.html', htmlContent);

    await browser.close();
})();
