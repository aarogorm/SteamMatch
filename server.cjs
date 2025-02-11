const express = require('express');
const cors = require('cors');
const axios = require('axios');  // Using axios instead of node-fetch

const app = express();
const STEAM_API_KEY = 'A9991E53A216AC681A620B7B7E2081A7';

app.use(cors());

app.get('/api/steam/games/:steamId', async (req, res) => {
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${req.params.steamId}&include_appinfo=true`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.log('Full error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Proxy server running on port 3001'));
