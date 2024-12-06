
/** Dev NodeJS model that hosts Machine learning model.
 * Run this script with Node.js to start the server:
 * `node server.js`
 */

const express = require('express');
const Arima = require('arima');
const cors = require('cors');
const { isArray } = require('mathjs');
const server = express();
const port = 3000;

server.use(cors()); // Add this line before your routes
// Middleware to parse JSON body data
server.use(express.json());

// Define API endpoint for ARIMA prediction
server.post('/predict', (req, res) => {
  const data = req.body.data;

  if (isArray(data) === false) {
    return res.status(400).json({ error: 'Data must be an array of numbers' });
  }
  // Set up ARIMA model
  const model = new Arima({
    p: 1,   // AR part, start with 1 for capturing the previous value
    d: 1,   // Differencing, try 1 for a simple trend removal
    q: 1    // MA part, start with 1 for modeling the error term
  });

  model.train(data);
  const forecast = model.predict(5); // Forecast the next 5 values

  // Send the prediction back as a response
  res.json({ forecast });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
