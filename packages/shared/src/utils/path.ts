export function isValidRelativePath(path: string) {
  if (!path.startsWith('/')) return false;
  // 제어문자를 끼워 넣는 우회와 헤더 인젝션을 차단한다.
  for (let i = 0; i < path.length; i += 1) {
    const code = path.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return false;
  }
  try {
    const base = 'https://datagsm.invalid';
    return new URL(path, base).origin === base;
  } catch {
    return false;
  }
}
