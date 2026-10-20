import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Prevent mobile browser pull-to-refresh gesture
if (typeof window !== 'undefined') {
  let touchStartY = 0;

  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;

      // When at the top of the page pulling downwards, cancel browser pull-to-refresh
      if (deltaY > 0 && (window.scrollY === 0 || document.documentElement.scrollTop === 0)) {
        let target = e.target as HTMLElement | null;
        let hasScrollableParentWithScroll = false;
        while (target && target !== document.body && target !== document.documentElement) {
          if (target.scrollTop > 0) {
            hasScrollableParentWithScroll = true;
            break;
          }
          target = target.parentElement;
        }

        if (!hasScrollableParentWithScroll && e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
