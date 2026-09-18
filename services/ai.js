import { askWithFallback, aiHealth } from '../lib/ai-router.js';
export async function askAI(prompt, options={}) { return askWithFallback(prompt, options); }
export { aiHealth };
