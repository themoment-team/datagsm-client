import { post } from '@repo/shared/api';
import { HttpResponse, apiPath, http, renderWithProviders, screen, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ClubExcelActions from '.';

// jsdom의 FormData·File은 MSW가 요청으로 바꾸지 못해, 업로드만 요청 함수 호출로 확인한다.
vi.mock('@repo/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/shared/api')>()),
  post: vi.fn(),
}));

describe('ClubExcelActions', () => {
  beforeEach(() => {
    vi.mocked(post).mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:excel');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('고른 파일을 동아리 가져오기 경로로 올린다', async () => {
    vi.mocked(post).mockResolvedValue({});
    const file = new File(['excel'], '동아리목록.xlsx');
    const { user } = renderWithProviders(<ClubExcelActions />);

    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file);

    await vi.waitFor(() =>
      expect(post).toHaveBeenCalledWith('/v1/clubs/imports', expect.any(FormData)),
    );
    expect((vi.mocked(post).mock.calls[0]?.[1] as FormData).get('file')).toBe(file);
  });

  it('Excel 다운로드는 동아리 목록 엑셀을 받는다', async () => {
    let requested = false;
    server.use(
      http.get(apiPath('/v1/clubs/exports/excel'), () => {
        requested = true;
        return HttpResponse.arrayBuffer(new ArrayBuffer(8));
      }),
    );
    const { user } = renderWithProviders(<ClubExcelActions />);

    await user.click(screen.getByRole('button', { name: 'Excel 다운로드' }));

    await vi.waitFor(() => expect(requested).toBe(true));
  });
});
