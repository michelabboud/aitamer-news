/** Independent homepage limits. The initial count includes the lead story. */
export const INITIAL_POST_COUNT = 12;
export const NEXT_BATCH_SIZE = 12;
export const MAX_AUTO_BATCHES = 5;

export const HOME_FEED_SETTINGS = Object.freeze({
  initialPostCount: INITIAL_POST_COUNT,
  nextBatchSize: NEXT_BATCH_SIZE,
  maxAutoBatches: MAX_AUTO_BATCHES,
});
