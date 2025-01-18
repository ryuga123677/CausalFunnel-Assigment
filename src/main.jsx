import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from "react";
import ReactDOM from "react-dom";
import './index.css'
import { Provider } from "react-redux";
import { store } from "./store"; 
import App from "./App"; 

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
  <App />
</Provider>,
)

