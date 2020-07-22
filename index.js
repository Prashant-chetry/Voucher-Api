const express = require('express');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 8000;
const initiateMongodbConnection = require('./db/index').default;
const authenticationRouter = require('./routes/authentication').default;
const { default: voucherRouter } = require('./routes/voucher');

const initiateMiddleWare = (server) => {
  server.use(express.json({ limit: 1000 }));
  server.set('trust proxy', true);
  server.use(
    cors({
      origin: '*',
      methods: 'GET,PUT,PATCH,POST,DELETE',
    })
  );
};
const initiateRouteHandler = (server) => {
  server.use('/v1/api/authentication', authenticationRouter);
  server.use('/v1/api/voucher', voucherRouter);
};
const initializeErrorHandling = (server) => {
  server.use(function (error, req, res, next) {
    return res.status(error.statusCode).json({ success: error.success, message: error.message });
  });
};
const main = async () => {
  const server = express();
  initiateMongodbConnection();
  initiateMiddleWare(server);
  initiateRouteHandler(server);
  server.listen(port, () => {
    console.log(`voucher api server listening at port ${port}`);
  });
  initializeErrorHandling(server);
};

main();
