export const minutesToMs = (minutes: number) => minutes * 60 * 1000;

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/** 같은 날 만든 항목끼리도 구분되도록 시각까지 표시한다. 숫자는 epoch milliseconds로 본다. */
export const formatDateTime = (date: string | number | Date) => {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
