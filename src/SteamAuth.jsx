import React, { useEffect, useState } from 'react';

const REDIRECT_URI = 'http://localhost:3000/auth/steam/callback';

export const SteamAuth = () => {
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [commonGames, setCommonGames] = useState({});
  const [loading, setLoading] = useState(false);

  const login = () => {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': REDIRECT_URI,
      'openid.realm': 'http://localhost:3000',
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });

    window.location.href = `https://steamcommunity.com/openid/login?${params}`;
  };

  const fetchFriendsGames = async (friendId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/steam/games/${friendId}`);
      const data = await response.json();
      return data.response?.games || [];
    } catch (error) {
      console.error(`Error fetching games for friend ${friendId}:`, error);
      return [];
    }
  };

  const findCommonGames = (userGames, friendGames) => {
    const userGameIds = new Set(userGames.map(game => game.appid));
    return friendGames.filter(game => userGameIds.has(game.appid));
  };

  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const steamId = params.get('openid.identity')?.split('/').pop();
    
    if (steamId) {
      setLoading(true);
      try {
        // Fetch user's games
        const gamesResponse = await fetch(
          `http://localhost:3001/api/steam/games/${steamId}`
        );
        const gamesData = await gamesResponse.json();
        setUserData(gamesData.response);

        // Fetch friends
        const friendsResponse = await fetch(
          `http://localhost:3001/api/steam/friends/${steamId}`
        );
        const friendsData = await friendsResponse.json();
        setFriends(friendsData.response.players);

        // Find common games for each friend
        const commonGamesMap = {};
        for (const friend of friendsData.response.players) {
          const friendGames = await fetchFriendsGames(friend.steamid);
          const common = findCommonGames(gamesData.response.games, friendGames);
          commonGamesMap[friend.steamid] = common;
        }
        setCommonGames(commonGamesMap);
      } catch (error) {
        console.error('API Error:', error);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.location.pathname === '/auth/steam/callback') {
      handleCallback();
    }
  }, []);

  return (
    <div className="p-4">
      {!userData && (
        <button onClick={login} className="bg-blue-500 text-white px-4 py-2 rounded">
          Login with Steam
        </button>
      )}
      
      {loading && <div>Loading...</div>}

      {friends.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Friends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map(friend => (
              <div key={friend.steamid} className="border rounded p-4">
                <div className="flex items-center gap-4">
                  <img src={friend.avatarmedium} alt={friend.personaname} className="rounded" />
                  <div>
                    <h3 className="font-bold">{friend.personaname}</h3>
                    <p className="text-sm text-gray-600">
                      {commonGames[friend.steamid]?.length || 0} games in common
                    </p>
                  </div>
                </div>
                <div className="mt-4 max-h-40 overflow-y-auto">
                  {commonGames[friend.steamid]?.map(game => (
                    <div key={game.appid} className="text-sm py-1">
                      {game.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SteamAuth;