const express = require('express');
const server = express();

server.get('/', (req, res) => {
  res.send('Bot is running!');
});

server.listen(3000, () => {
  console.log('Server is ready.');
}); 