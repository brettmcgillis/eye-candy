/* eslint-disable */

/**
 * Yield control back to the browser so it can process rendering, input events,
 * and animation frames.  Calling `await yieldToMain()` inside a long-running
 * async pipeline prevents it from monopolising the main thread.
 */
export const yieldToMain = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
