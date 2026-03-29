const express = require('express');
const morgan = require('morgan');

const securityMiddleware = require('./config/security');
const corsMiddleware = require('./config/cors');

const routes = require('./routes');
const requestIdMiddleware = require('./middlewares/request-id.middleware');
const loggerMiddleware = require('./middlewares/logger.middleware');
const notFoundMiddleware = require('./middlewares/not-found.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(requestIdMiddleware);

app.use(morgan('dev'));
app.use(loggerMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'EsquinaRevis backend is running',
  });
});

app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;