/** 서버의 배포 URL 검증(`^https?://.*`)과 같은 규칙. 서버는 대소문자를 구분하므로 `i` 플래그를 붙이지 않는다. */
export const HTTP_URL_PATTERN = /^https?:\/\//;

/** href에 넣어도 되는 http(s) 주소만 돌려준다. 사용자가 입력한 값이라 javascript: 같은 스킴은 링크로 쓰지 않는다. */
export const getSafeUrl = (url?: string | null) => (url && HTTP_URL_PATTERN.test(url) ? url : null);
