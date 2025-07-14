const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const appointmentRoutes = require('./routes/appointment');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/send-appointment-email', appointmentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
