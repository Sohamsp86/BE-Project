import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import "./styles/global.css";
import GetStarted from "./components/GetStarted";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/getStarted" element={<GetStarted />} />
      </Routes>
    </Router>
  );
}

export default App;
