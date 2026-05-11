const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/annadan';

console.log('Connecting...');

mongoose.connect(uri)
  .then(() => {
    console.log('CONNECTED! MongoDB chal raha hai!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('Error:', err.message);
    process.exit(1);
  });