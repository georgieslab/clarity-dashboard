import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve static files from src directory
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 5173;
app.listen(PORT, () => {
  console.log(`\n🚀 Dev server running on http://localhost:${PORT}`);
  console.log(`⚡ Backend running on http://localhost:3000\n`);
});