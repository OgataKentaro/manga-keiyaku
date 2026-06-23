const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the design directory
app.use('/design', express.static(path.join(__dirname, 'design')));

// Serve standalone-preview.html as the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'design', 'standalone-preview.html'));
});

app.listen(PORT, () => {
  console.log(`マンガ契約 running on port ${PORT}`);
});
