import React, { useEffect, useState } from 'react';

const REDIRECT_URI = 'http://localhost:3000/auth/steam/callback';

export const SteamAuth = () => {
  const [userData, setUserData] = useState(null);

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

  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const steamId = params.get('openid.identity')?.split('/').pop();
    if (steamId) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/steam/games/${steamId}`
        );
        const data = await response.json();
        console.log('Steam API response:', data);
        setUserData(data.response);
      } catch (error) {
        console.error('API Error:', error);
      }
    }
  };

  useEffect(() => {
    if (window.location.pathname === '/auth/steam/callback') {
      handleCallback();
    }
  }, []);

  return (
    <div className="p-4">
      <button onClick={login} className="bg-blue-500 text-white px-4 py-2 rounded">
        Login with Steam
      </button>
      
      {userData && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(userData, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default SteamAuth;