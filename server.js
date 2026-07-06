const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve design folder at root so relative paths (./support.js etc.) work
app.use(express.static(path.join(__dirname, 'design')));

// Serve the editable dc.html as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'design', 'マンガ契約.dc.html'));
});

app.listen(PORT, () => {
  console.log(`マンガ契約 running on port ${PORT}`);
});
