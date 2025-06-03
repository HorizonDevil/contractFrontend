import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // ✅ This is missing in your code
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css'
import App from './components/App';
import MagicLinkLanding from './components/MagicLinkLanding';
import { TemplateProvider } from './context/TemplateContext'; // ✅ don't forget this

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemplateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/fill" element={<MagicLinkLanding />} />
        </Routes>
      </BrowserRouter>
    </TemplateProvider>
  </StrictMode>
);
