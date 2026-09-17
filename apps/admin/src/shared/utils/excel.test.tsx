import { HttpResponse, apiError, apiPath, http, render, screen, server } from '@repo/test-utils';
import { Toaster } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadExcel } from './excel';

describe('downloadExcel', () => {
  let clickedLinks: { href: string; download: string | null }[];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 5, 10, 0));
    clickedLinks = [];

    // jsdom에는 Blob URL과 실제 다운로드가 없으므로, 만든 링크와 해제 여부만 기록한다.
    URL.createObjectURL = vi.fn(() => 'blob:excel');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clickedLinks.push({ href: this.href, download: this.getAttribute('download') });
    });
    render(<Toaster />);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('파일을 받아 이름_날짜.xlsx로 저장하게 하고, 임시 URL과 링크를 정리한다', async () => {
    server.use(
      http.get(apiPath('/v1/students/exports/excel'), () =>
        HttpResponse.arrayBuffer(new ArrayBuffer(8)),
      ),
    );

    await downloadExcel({ url: '/v1/students/exports/excel', fileName: '학생목록' });

    expect(clickedLinks).toEqual([{ href: 'blob:excel', download: '학생목록_2026-03-05.xlsx' }]);
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:excel');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(await screen.findByText('Excel 다운로드에 성공했습니다.')).toBeInTheDocument();
  });

  it('실패하면 파일을 저장하지 않고 실패를 알린다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(http.get(apiPath('/v1/clubs/exports/excel'), () => apiError(500, 'error')));

    await downloadExcel({
      url: '/v1/clubs/exports/excel',
      fileName: '동아리목록',
      errorMessage: '동아리 목록을 받지 못했습니다.',
    });

    expect(clickedLinks).toEqual([]);
    expect(await screen.findByText('동아리 목록을 받지 못했습니다.')).toBeInTheDocument();
  });
});
