// Google Analytics & Event Telemetry Module
// Safe for both client-side browser execution and SSR.

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  'G-Y7SX7RYB75';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Log page view to Google Analytics
 */
export function trackPageView(url: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  } catch (err) {
    console.debug('GA Pageview tracking error:', err);
  }
}

/**
 * Log custom interactive event to Google Analytics
 */
export function trackEvent(
  action: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('event', action, params);
  } catch (err) {
    console.debug('GA Event tracking error:', err);
  }
}
