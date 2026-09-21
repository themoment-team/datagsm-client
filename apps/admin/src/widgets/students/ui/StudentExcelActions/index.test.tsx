import { post } from '@repo/shared/api';
import { HttpResponse, apiPath, http, renderWithProviders, screen, server } from '@repo/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StudentExcelActions from '.';

// jsdom의 FormData·File은 MSW가 요청으로 바꾸지 못해, 업로드만 요청 함수 호출로 확인한다.
vi.mock('@repo/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/shared/api')>()),
  post: vi.fn(),
}));

const excelFile = () =>
  new File(['excel'], '학생목록.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;

const uploadedFiles = () =>
  vi.mocked(post).mock.calls.map(([url, body]) => [url, (body as FormData).get('file')]);

describe('StudentExcelActions', () => {
  beforeEach(() => {
    vi.mocked(post).mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:excel');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('Excel 업로드는 엑셀 파일만 고를 수 있는 파일 선택창을 연다', async () => {
    const { user } = renderWithProviders(<StudentExcelActions />);
    const openPicker = vi.spyOn(fileInput(), 'click');

    await user.click(screen.getByRole('button', { name: 'Excel 업로드' }));

    expect(openPicker).toHaveBeenCalled();
    expect(fileInput()).toHaveAttribute('accept', '.xlsx,.xls');
  });

  it('고른 파일을 FormData의 file 필드에 담아 학생 가져오기 경로로 올리고 성공을 알린다', async () => {
    vi.mocked(post).mockResolvedValue({});
    const file = excelFile();
    const { user } = renderWithProviders(<StudentExcelActions />);

    await user.upload(fileInput(), file);

    expect(await screen.findByText('Excel 업로드에 성공했습니다.')).toBeInTheDocument();
    expect(uploadedFiles()).toEqual([['/v1/students/imports', file]]);
  });

  it('같은 파일을 다시 올릴 수 있도록 선택값을 비운다', async () => {
    vi.mocked(post).mockResolvedValue({});
    const { user } = renderWithProviders(<StudentExcelActions />);

    await user.upload(fileInput(), excelFile());
    await screen.findByText('Excel 업로드에 성공했습니다.');

    expect(fileInput()).toHaveValue('');
    await user.upload(fileInput(), excelFile());
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  });

  it('업로드에 실패하면 실패를 알린다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(post).mockRejectedValue(new Error('형식 오류'));
    const { user } = renderWithProviders(<StudentExcelActions />);

    await user.upload(fileInput(), excelFile());

    expect(await screen.findByText('Excel 업로드에 실패했습니다.')).toBeInTheDocument();
  });

  it('Excel 다운로드는 학생 목록 엑셀을 받는다', async () => {
    let requested = false;
    server.use(
      http.get(apiPath('/v1/students/exports/excel'), () => {
        requested = true;
        return HttpResponse.arrayBuffer(new ArrayBuffer(8));
      }),
    );
    const { user } = renderWithProviders(<StudentExcelActions />);

    await user.click(screen.getByRole('button', { name: 'Excel 다운로드' }));

    expect(await screen.findByText('Excel 다운로드에 성공했습니다.')).toBeInTheDocument();
    expect(requested).toBe(true);
  });
});
