import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './styles/index.css';

const isSpeaker = new URLSearchParams(window.location.search).has('speaker');
const Root = isSpeaker ? lazy(() => import('./app/SpeakerApp')) : lazy(() => import('./app/App'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
);
