const express = require('express');
const server = express();

server.get('/', (req, res) => {
  res.send('Bot is running!');
});

function keepAlive() {
  server.listen(3000, () => {
    console.log('Web server running on port 3000');
  });
}

module.exports = keepAlive; 