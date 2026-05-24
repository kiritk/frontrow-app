type Handler = () => void | Promise<void>;

let handler: Handler | null = null;

export function registerRestartOnboarding(fn: Handler) {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

export async function restartOnboarding() {
  if (handler) await handler();
}
