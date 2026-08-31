import { config } from '../lib/config.js';
import { generateContent } from './content.js';

export function aiStatus() {
  return { enabled: Boolean(config.ai.baseUrl && config.ai.apiKey), model: config.ai.model };
}
export function createContent() { return generateContent({ ...config.ai, enabled: aiStatus().enabled }); }
