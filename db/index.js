const mongoose = require('mongoose');
const URL = process.env.MONGO_URL || 'mongodb://localhost:27017/voucher';

module.exports.default = () => {
  mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.connection.on('connected', () => {
    console.log('mongodb connected');
  });
  mongoose.connection.on('disconnected', function () {
    console.log('mongodb disconnected');
  });
  mongoose.connection.on('error', function (error) {
    console.error('mongodb error', error);
  });
};
