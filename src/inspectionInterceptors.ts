/**
 * Interceptors to block API and Firebase requests when CTRL is pressed
 * Only active in development
 */

let isInspectionActive = false;

/**
 * Set inspection active state (called from InspectionContext)
 */
export const setInspectionActive = (active: boolean): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  isInspectionActive = active;
};

/**
 * Check if inspection is active and requests should be blocked
 */
export const shouldBlockRequest = (): boolean => {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }
  return isInspectionActive;
};

/**
 * Intercept fetch requests (for API calls)
 */
export const setupFetchInterceptor = (): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    if (shouldBlockRequest()) {
      console.warn("[Inspection] Blocked API request (CTRL held):", args[0]);
      // Return a rejected promise to prevent the request
      return Promise.reject(new Error("Request blocked: Inspection mode active (CTRL held)"));
    }
    return originalFetch(...args);
  };
};

/**
 * Intercept Firebase Firestore operations
 * Note: Firestore operations are harder to intercept at the SDK level
 * We'll rely on blocking at the fetch level (which Firestore uses internally)
 * and also provide a wrapper utility for direct Firestore calls
 */
export const setupFirestoreInterceptor = (): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // Firestore uses fetch internally, so the fetch interceptor will catch most operations
  // For direct Firestore SDK calls, we'll need to wrap them manually
  // This is a limitation of the Firestore SDK architecture
};

/**
 * Setup all interceptors
 */
export const setupInterceptors = (): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  setupFetchInterceptor();
  setupFirestoreInterceptor();
};
