/**
 * 짝이 맞는 `**굵게**` 구간만 <b>로 바꾸고 나머지는 텍스트로 그린다.
 * 문구를 HTML로 해석하지 않아 서버에서 받아오게 바뀌어도 태그가 실행되지 않고,
 * 짝이 깨진 `**`는 굵게 처리하지 않고 글자 그대로 남긴다.
 */
export const renderBoldText = (text: string) =>
  text
    .split(/(\*\*[^*]+\*\*)/)
    .map((part, index) => (index % 2 === 1 ? <b key={index}>{part.slice(2, -2)}</b> : part));
