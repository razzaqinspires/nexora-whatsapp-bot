import test from 'node:test';
import assert from 'node:assert/strict';
import { button, buttonPayload } from '../services/buttons.js';

test('v12 button payload keeps max 3 safe buttons', () => {
  const payload = buttonPayload({ text: 'Actions', buttons: [button('.profile','Profile'), button('.inventory','Inventory'), button('.status','Status'), button('.bad','This label is definitely too long for WhatsApp') ] });
  assert.equal(payload.buttons.length, 3);
  assert.equal(payload.buttons[0].buttonId, '.profile');
  assert.equal(payload.buttons[1].buttonText.displayText, 'Inventory');
});

test('v12 button ids are normal commands', () => {
  const payload = buttonPayload({ text: 'Menu', buttons: [button('!menu','Menu'), button('#status','Status')] });
  assert.deepEqual(payload.buttons.map(x => x.buttonId), ['!menu','#status']);
});
