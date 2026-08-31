import { config } from '../lib/config.js';

export async function askAI(prompt) {
  if (!config.ai.baseUrl || !config.ai.apiKey) return null;
  const response = await fetch(config.ai.baseUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${config.ai.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: config.ai.model, messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || null;
}
