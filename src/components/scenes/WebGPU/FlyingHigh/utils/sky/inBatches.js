// Runs `each` over `items` `size` at a time, settling between batches.
const inBatches = (items, size, settle, each) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, b) =>
    items.slice(b * size, b * size + size)
  ).reduce(
    (done, batch) =>
      done.then(() => {
        batch.forEach(each);
        return settle();
      }),
    Promise.resolve()
  );

export default inBatches;
