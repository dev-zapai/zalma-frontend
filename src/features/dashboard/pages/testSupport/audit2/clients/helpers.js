import { act } from 'react';
import { createRoot } from 'react-dom/client';

export async function flush(n = 8) {
  for (let i = 0; i < n; i++) await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}

const roots = [];

// Unmount every probe root so an earlier test's page stops reacting to the
// shared router store.
export async function unmountAll() {
  while (roots.length) { const r = roots.pop(); await act(async () => { r.unmount(); }); }
  document.body.innerHTML = '';
}

export async function mount(el) {
  const c = document.createElement('div');
  document.body.appendChild(c);
  const root = createRoot(c);
  roots.push(root);
  await act(async () => { root.render(el); });
  await flush();
  return c;
}

export async function setValue(input, value) {
  const proto = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype
    : input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
  await flush(2);
}

export async function click(el) {
  await act(async () => { el.click(); });
  await flush();
}

export function buttonByText(root, text) {
  return [...root.querySelectorAll('button')].find(b => b.textContent.replace(/\s+/g, ' ').trim().includes(text));
}

export function inputByPlaceholder(root, ph) {
  return root.querySelector(`input[placeholder="${ph}"]`);
}
