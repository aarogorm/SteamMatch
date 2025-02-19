const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Cache for store details to avoid rate limiting
const storeCache = new Map();

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

app.get('/api/steam/friends/:steamId', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetFriendList/v1/`,
      {
        params: {
          key: STEAM_API_KEY,
          steamid: req.params.steamId,
          relationship: 'friend'
        }
      }
    );
    
    // Get friend details (names, avatars, etc.)
    const friendIds = response.data.friendslist.friends.map(friend => friend.steamid);
    const friendDetailsResponse = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`,
      {
        params: {
          key: STEAM_API_KEY,
          steamids: friendIds.join(',')
        }
      }
    );

    res.json(friendDetailsResponse.data);
  } catch (error) {
    console.error('Error fetching friends:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get store details for a game
app.get('/api/steam/game-details/:appId', async (req, res) => {
  try {
    const appId = req.params.appId;
    
    // Check cache first
    if (storeCache.has(appId)) {
      return res.json(storeCache.get(appId));
    }

    const response = await axios.get(
      `https://store.steampowered.com/api/appdetails`,
      {
        params: {
          appids: appId,
          filters: 'categories,genres'
        }
      }
    );

    const gameDetails = response.data[appId].data;
    
    // Cache the results
    storeCache.set(appId, gameDetails);
    
    res.json(gameDetails);
  } catch (error) {
    console.error('Error fetching game details:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Helper endpoint to get multiplayer games in common
app.get('/api/steam/multiplayer-games-in-common/:userSteamId/:friendSteamId', async (req, res) => {
  try {
    // Get both users' games
    const [userGames, friendGames] = await Promise.all([
      axios.get(`http://localhost:3001/api/steam/games/${req.params.userSteamId}`),
      axios.get(`http://localhost:3001/api/steam/games/${req.params.friendSteamId}`)
    ]);

    // Find common games
    const userGameSet = new Set(userGames.data.response.games.map(g => g.appid));
    const commonGames = friendGames.data.response.games.filter(g => userGameSet.has(g.appid));

    // Get detailed info for common games
    const multiplayerGames = [];
    
    for (const game of commonGames) {
      try {
        const details = await axios.get(`http://localhost:3001/api/game-details/${game.appid}`);
        
        // Check if game has multiplayer features
        const isMultiplayer = details.data.categories?.some(cat => 
          ['Multi-player', 'Co-op', 'Online Co-op', 'Local Co-op']
            .includes(cat.description)
        );

        if (isMultiplayer) {
          multiplayerGames.push({
            ...game,
            details: details.data,
            categories: details.data.categories,
            genres: details.data.genres
          });
        }
      } catch (error) {
        console.error(`Error fetching details for game ${game.appid}:`, error);
      }
    }

    res.json(multiplayerGames);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Proxy server running on port 3001'));