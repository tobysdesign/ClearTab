/*
 * Keeps the /demo page (embedded in the landing page's iframes) from touching anything
 * outside itself. It runs on the app's own origin, so without this it would:
 * - share the real dashboard's localStorage (saved layout, preferences cache, switches...)
 * - scroll the landing page: scrollIntoView in a same-origin iframe scrolls the parent too
 * - take keyboard focus from the landing page when a widget focuses an input
 */

function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => (items.has(key) ? items.get(key)! : null),
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key)
    },
    setItem: (key, value) => {
      items.set(key, String(value))
    },
  }
}

function isolateStorage() {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      Object.defineProperty(window, name, { configurable: true, value: memoryStorage() })
    } catch (error) {
      console.warn(`Demo: couldn't isolate ${name}`, error)
    }
  }
}

// Scroll only the element's own scrolling container, never the page around the iframe
function containScrolling() {
  Element.prototype.scrollIntoView = function scrollWithinDemo(this: Element) {
    let box = this.parentElement
    while (box && !(box.scrollHeight > box.clientHeight && /(auto|scroll)/.test(getComputedStyle(box).overflowY))) {
      box = box.parentElement
    }
    if (!box) return
    box.scrollTop += this.getBoundingClientRect().top - box.getBoundingClientRect().top
  }
}

// The scripts drive everything without focus, so nothing in the demo ever needs it
function blockFocus() {
  HTMLElement.prototype.focus = function noFocus() {}
}

export function sandboxDemo() {
  isolateStorage()
  containScrolling()
  blockFocus()
}
