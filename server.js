const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { PORT } = require('./src/config');
const gateway = require('./src/gateway');

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(compression());

// Lets a host check the server is alive
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Everything under /api goes to the gateway
app.use('/api', gateway);

app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));