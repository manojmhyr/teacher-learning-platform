import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { assertConfigValid } from '@/config/env';

const problems = assertConfigValid();
if (problems.length) {
  // Fail loudly rather than silently showing empty lesson content.
  console.error('[Teacher Portal] configuration problems:\n' + problems.map((p) => ` • ${p}`).join('\n'));
}

const root = document.getElementById('root');
if (root) {
  root.setAttribute('data-mounted', 'true');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
