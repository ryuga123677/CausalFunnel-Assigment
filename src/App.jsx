import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {StartPage} from "./Startpage";
import {Quiz} from "./Quizpage"; 

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>/
    </Router>
  );
};

export default App;
