import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from "react";
import ReactDOM from "react-dom";
import './index.css'
import { Provider } from "react-redux";
import { store } from "./store"; // Make sure to import your store here
import App from "./App"; // Your main App component

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
  <App />
</Provider>,
)
// index.js or App.js (entry point)
