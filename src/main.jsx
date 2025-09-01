import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { DarkModeProvider } from './components/DarkModeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <DarkModeProvider>
          <App />
        </DarkModeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)
