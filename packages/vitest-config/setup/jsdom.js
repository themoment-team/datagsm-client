import '@testing-library/jest-dom/vitest';

// node 환경으로 바꾼 파일에서도 이 setup이 실행되므로 DOM이 있을 때만 채운다.
if (typeof window !== 'undefined') {
  // Radix(Dialog, Select, Popover)가 쓰지만 jsdom에는 없는 API
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};

  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
