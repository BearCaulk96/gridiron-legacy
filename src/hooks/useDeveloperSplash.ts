import { useEffect, useRef } from 'react';

const MIN_MS = 2400;
const FADE_MS = 550;

/**
 * Drives the HTML #boot-splash (Bear Caulk Game Studios) that paints before React loads.
 * Holds for a beat after the app is ready, then fades out once per cold boot.
 */
export function useDeveloperSplash(onDone: () => void) {
  const doneRef = useRef(false);

  useEffect(() => {
    const el = document.getElementById('boot-splash');
    if (!el) {
      onDone();
      return;
    }

    const started = performance.now();
    let holdTimer: number | null = null;
    let fadeTimer: number | null = null;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (holdTimer != null) window.clearTimeout(holdTimer);
      el.classList.add('is-out');
      fadeTimer = window.setTimeout(() => {
        el.remove();
        onDone();
      }, FADE_MS);
    };

    const schedule = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      holdTimer = window.setTimeout(finish, wait);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish();
    };

    el.addEventListener('click', finish);
    el.addEventListener('keydown', onKey);
    schedule();

    // Fail-safe if something goes wrong
    const failSafe = window.setTimeout(finish, MIN_MS + 5000);

    return () => {
      el.removeEventListener('click', finish);
      el.removeEventListener('keydown', onKey);
      if (holdTimer != null) window.clearTimeout(holdTimer);
      if (fadeTimer != null) window.clearTimeout(fadeTimer);
      window.clearTimeout(failSafe);
    };
  }, [onDone]);
}
