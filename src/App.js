import './App.css';
import './styles/photobooth.css';
import React from "react";
import Photobooth from "./components/Photobooth";
import "./styles/global.css"

function App() {
  return (
    <div className="App">
      <div className="app-logo-bar">
        <h1 className="app-logo-title">
          Photobooth
        </h1>
      </div>

      <div className="app-content">
        <Photobooth />
      </div>
    </div>
  );
}

export default App;
