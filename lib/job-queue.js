export class JobQueue {
  constructor({ concurrency = 1, maxSize = 100 } = {}) { this.concurrency = concurrency; this.maxSize = maxSize; this.active = 0; this.queue = []; this.ids = new Set(); }
  get size() { return this.queue.length; }
  get activeCount() { return this.active; }
  add(id, task) {
    if (this.ids.has(id) || this.queue.length >= this.maxSize) return false;
    this.ids.add(id); this.queue.push({ id, task }); this.#drain(); return true;
  }
  clear() { this.queue = []; }
  async #drain() {
    while (this.active < this.concurrency && this.queue.length) {
      const job = this.queue.shift(); this.active++;
      Promise.resolve().then(job.task).catch(e => console.error('[QUEUE]', e)).finally(() => { this.active--; this.ids.delete(job.id); this.#drain(); });
    }
  }
}
