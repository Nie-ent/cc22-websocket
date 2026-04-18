import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* ToastContainer อยู่ที่ root เพื่อให้ทุก component ใช้ toast() ได้เลย */}
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      theme="dark"
    />
  </StrictMode>
);
