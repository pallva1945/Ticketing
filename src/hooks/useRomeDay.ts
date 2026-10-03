import { useEffect, useState } from 'react';
import { romeDay } from '../utils/fixtureEligibility';

// Refresh eligibility without requiring another upload or a page reload.
export function useRomeDay() {
  const [day, setDay] = useState(() => romeDay());
  useEffect(() => {
    const update = () => setDay(romeDay());
    const interval = window.setInterval(update, 1000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return day;
}