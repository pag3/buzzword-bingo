const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serves the static build produced by `npm run build` (runs automatically
// before `npm start`).
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
