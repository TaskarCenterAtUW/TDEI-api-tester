const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Get the path to the current directory
    const currentDir = process.cwd();

    // Specify the path to the HTML file relative to the current directory
    const htmlFilePath = path.join(currentDir, 'test-report.html');

    // Load the HTML file
    const fileUrl = `file://${htmlFilePath}`;
    await page.goto(fileUrl);

    // Extract HTML content
    let htmlContent = await page.content();

    // Extract script source URLs from the HTML content
    const scriptSrcs = htmlContent.match(/<script.*?src=["'](.*?)["']/g);
    scriptSrcs.push('<script defer="defer" src="./jest-html-reporters-attach/test-report/result.js"')
    // Fetch and append content of each JavaScript file to the HTML content
    // Fetch and append content of each JavaScript file to the HTML content
    if (scriptSrcs) {
        for (const scriptSrc of scriptSrcs) {
            const src = scriptSrc.match(/src=["'](.*?)["']/)[1];
            const scriptFilePath = path.join(currentDir, src);
            // Read the content of the JavaScript file
            const scriptContent = fs.readFileSync(scriptFilePath, 'utf8');

            // Append the JavaScript content to the HTML content
            htmlContent += `<script>${scriptContent}</script>`;
        }
    }

    // Write the scraped content to a new HTML file
    fs.writeFileSync('test-report.html', htmlContent);

    await browser.close();
})();
