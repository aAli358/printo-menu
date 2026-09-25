import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './api/auth'
import App from './App.tsx'
import { consumeHandoffFromQuery, consumeSessionFromHash, needsAuthBootstrap } from './utils/authRedirect'
import { SessionSplash } from './components/SessionSplash'

const SESSION_BOOT_MS = 900

function Bootstrap() {
  const [booting, setBooting] = useState(needsAuthBootstrap())

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (new URLSearchParams(window.location.search).has('handoff')) {
        await consumeHandoffFromQuery();
      } else if (window.location.hash.startsWith('#session=')) {
        consumeSessionFromHash();
      } else {
        if (!cancelled) setBooting(false);
        return;
      }
      if (!cancelled) {
        window.setTimeout(() => setBooting(false), SESSION_BOOT_MS);
      }
    })();

    return () => { cancelled = true; };
  }, [])

  if (booting) {
    return <SessionSplash message="جاري تجهيز لوحة التحكم..." />
  }

  return <App />
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
