type Listener = (count: number) => void

let activeRequests = 0
const listeners = new Set<Listener>()

export function startRequest() {
  activeRequests += 1
  listeners.forEach((listener) => listener(activeRequests))
}

export function endRequest() {
  activeRequests = Math.max(0, activeRequests - 1)
  listeners.forEach((listener) => listener(activeRequests))
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getActiveRequests() {
  return activeRequests
}
