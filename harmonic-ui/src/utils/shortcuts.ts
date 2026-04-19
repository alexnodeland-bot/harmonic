/**
 * Keyboard Shortcuts System
 * Space: play/pause
 * Enter: mutate
 * Arrow keys: navigate population
 * R: random
 * E: export
 * ?: show help overlay
 */

export interface ShortcutHandler {
  (e: KeyboardEvent): void;
}

export interface ShortcutBinding {
  key: string;
  handler: ShortcutHandler;
  description: string;
  enabled: boolean;
}

class KeyboardShortcuts {
  private bindings: Map<string, ShortcutBinding> = new Map();
  private enabled = true;

  register(key: string, handler: ShortcutHandler, description: string, enabled = true) {
    this.bindings.set(key.toLowerCase(), {
      key,
      handler,
      description,
      enabled,
    });
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  handle(e: KeyboardEvent) {
    if (!this.enabled || !e.key) return;

    const key = e.key.toLowerCase();
    const binding = this.bindings.get(key);

    if (binding && binding.enabled && !this.isInputFocused(e.target)) {
      binding.handler(e);
    }
  }

  private isInputFocused(target: EventTarget | null): boolean {
    if (!target) return false;
    const element = target as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || element.contentEditable === 'true';
  }

  getBindings(): Array<{ key: string; description: string; enabled: boolean }> {
    return Array.from(this.bindings.values()).map((b) => ({
      key: b.key,
      description: b.description,
      enabled: b.enabled,
    }));
  }

  clear() {
    this.bindings.clear();
  }
}

let instance: KeyboardShortcuts | null = null;

export const getKeyboardShortcuts = (): KeyboardShortcuts => {
  if (!instance) {
    instance = new KeyboardShortcuts();
    document.addEventListener('keydown', (e) => instance!.handle(e));
  }
  return instance;
};

/**
 * React Hook for keyboard shortcuts
 */
import { useEffect } from 'react';

export const useKeyboardShortcuts = (callbacks: {
  onPlayToggle?: () => void;
  onMutate?: () => void;
  onRandom?: () => void;
  onExport?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onShowHelp?: () => void;
}) => {
  useEffect(() => {
    const shortcuts = getKeyboardShortcuts();

    // Register shortcuts
    if (callbacks.onPlayToggle) {
      shortcuts.register(' ', (e) => {
        e.preventDefault();
        callbacks.onPlayToggle?.();
      }, 'Play/Pause (Space)');
    }

    if (callbacks.onMutate) {
      shortcuts.register('enter', (e) => {
        callbacks.onMutate?.();
      }, 'Mutate (Enter)');
    }

    if (callbacks.onNavigateNext) {
      shortcuts.register('arrowright', (e) => {
        e.preventDefault();
        callbacks.onNavigateNext?.();
      }, 'Navigate Right (→)');
    }

    if (callbacks.onNavigatePrev) {
      shortcuts.register('arrowleft', (e) => {
        e.preventDefault();
        callbacks.onNavigatePrev?.();
      }, 'Navigate Left (←)');
    }

    if (callbacks.onRandom) {
      shortcuts.register('r', (e) => {
        callbacks.onRandom?.();
      }, 'Random Patch (R)');
    }

    if (callbacks.onExport) {
      shortcuts.register('e', (e) => {
        callbacks.onExport?.();
      }, 'Export (E)');
    }

    if (callbacks.onShowHelp) {
      shortcuts.register('?', (e) => {
        e.preventDefault();
        callbacks.onShowHelp?.();
      }, 'Show Help (?)');
    }

    return () => {
      // Cleanup: unregister shortcuts on unmount
      shortcuts.clear();
    };
  }, [callbacks]);
};

/**
 * Create help overlay HTML
 */
export const createHelpOverlay = (): HTMLDivElement => {
  const overlay = document.createElement('div');
  overlay.className = 'keyboard-help-overlay animate-overlay-fade';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    background: var(--surface);
    border: 2px solid var(--primary);
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 10000;
    animation: popupScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;

  const title = document.createElement('h2');
  title.textContent = '⌨️ Keyboard Shortcuts';
  title.style.cssText = 'color: var(--primary); margin-bottom: 1.5rem; margin-top: 0;';
  panel.appendChild(title);

  const shortcuts = getKeyboardShortcuts();
  const bindings = shortcuts.getBindings();

  const list = document.createElement('ul');
  list.style.cssText = 'list-style: none; margin: 0; padding: 0;';

  bindings.forEach((binding) => {
    const item = document.createElement('li');
    item.style.cssText = `
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const keySpan = document.createElement('span');
    keySpan.textContent = binding.key;
    keySpan.style.cssText = `
      background: var(--surface-light);
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 600;
      color: var(--primary);
      margin-right: 1rem;
      min-width: 60px;
      text-align: center;
    `;

    const descSpan = document.createElement('span');
    descSpan.textContent = binding.description;
    descSpan.style.cssText = 'color: var(--text-dim); flex: 1;';

    item.appendChild(keySpan);
    item.appendChild(descSpan);
    list.appendChild(item);
  });

  panel.appendChild(list);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close (ESC)';
  closeBtn.style.cssText = `
    margin-top: 1.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--primary);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;
  `;

  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.background = '#00ff99';
  });

  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.background = 'var(--primary)';
  });

  panel.appendChild(closeBtn);
  overlay.appendChild(panel);

  const closeOverlay = () => {
    overlay.classList.add('animate-fade-out');
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  };

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
    }
  });

  return overlay;
};
