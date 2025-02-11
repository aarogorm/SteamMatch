import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import SteamAuth from "../SteamAuth";

function App() {
  const STEAM_API_URL = '';
  return (
    <div>
      <Header />
      <SteamAuth />
      <Footer />
    </div>
  );
}

export default App;
