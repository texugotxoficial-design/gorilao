import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 80;
const distPath = path.join(__dirname, 'dist');

console.log('--- Server Startup ---');
console.log('Current directory:', __dirname);
console.log('Checking for dist folder at:', distPath);

if (fs.existsSync(distPath)) {
  console.log('SUCCESS: dist folder found.');
} else {
  console.error('ERROR: dist folder NOT found! Did you run "npm run build"?');
}

// Serve static files from the 'dist' directory
app.use(express.static(distPath));

// Handle SPA routing: send all requests to index.html
app.get('*', (req, res) => {
  const indexFile = path.join(distPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Error: Build files missing. Please check server logs.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log('----------------------');
});
