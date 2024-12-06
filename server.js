const express = require('express');
const Arima = require('arima');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors()); // Add this line before your routes
// Middleware to parse JSON body data
app.use(express.json());

// Define API endpoint for ARIMA prediction
app.post('/predict', (req, res) => {
  const data = req.body.data; // Assuming data is an array of numbers

  // Set up ARIMA model
  const model = new Arima({
    p: 0,   // AR part
    d: 1,   // Differencing
    q: 1    // MA part
  });

  model.train(data);
  const forecast = model.predict(5); // Forecast the next 5 values

  // Send the prediction back as a response
  res.json({ forecast });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
