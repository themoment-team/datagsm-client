import {
  HttpResponse,
  apiError,
  apiPath,
  apiSuccess,
  http,
  renderWithProviders,
  screen,
  server,
} from '@repo/test-utils';
import { File as NodeFile } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import { PROJECT_ICON_MAX_SIZE } from '@/entities/project';

import ProjectIconField from '.';

const ICON_UPLOAD_URL_PATH = apiPath('/v1/students/me/projects/icons/upload-url');
const ICON_UPLOAD_URL = 'https://s3.example.com/project-icons/upload';
const NETWORK_ERROR_MESSAGE =
  '아이콘을 올리지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.';

// vitest의 jsdom 호환 계층이 jsdom File을 Node Blob으로 바꾸지 못해 미리보기 URL 생성과
// S3 PUT이 실패하므로 Node의 File을 쓴다.
const iconFile = (size = 1) =>
  new NodeFile([new Uint8Array(size)], 'icon.png', { type: 'image/png' }) as unknown as File;

/** 필드를 그리고 아이콘 파일을 고른다. */
const selectIcon = async (file = iconFile()) => {
  const { user, container } = renderWithProviders(<ProjectIconField onChange={() => {}} />);
  // 파일 input은 ARIA 역할이 없어 getByRole로 찾을 수 없다.
  await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, file);
};

describe('ProjectIconField 업로드 실패 안내', () => {
  it('업로드 URL 발급이 요청 횟수 제한에 걸리면 서버 안내를 보여 준다', async () => {
    server.use(
      http.post(ICON_UPLOAD_URL_PATH, () =>
        apiError(429, '아이콘 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'),
      ),
    );

    await selectIcon();

    expect(
      await screen.findByText('아이콘 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument();
  });

  it('업로드 URL 발급이 안내 없이 실패하면 업로드 실패 안내를 보여 준다', async () => {
    server.use(http.post(ICON_UPLOAD_URL_PATH, () => new HttpResponse(null, { status: 500 })));

    await selectIcon();

    expect(await screen.findByText('아이콘 업로드에 실패했습니다.')).toBeInTheDocument();
  });

  it('업로드 URL 발급 요청이 응답 없이 끊기면 영문 오류 대신 네트워크 안내를 보여 준다', async () => {
    server.use(http.post(ICON_UPLOAD_URL_PATH, () => HttpResponse.error()));

    await selectIcon();

    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
  });

  it('S3 업로드가 네트워크 오류로 끊기면 영문 오류 대신 네트워크 안내를 보여 준다', async () => {
    server.use(
      http.post(ICON_UPLOAD_URL_PATH, () =>
        apiSuccess({
          uploadUrl: ICON_UPLOAD_URL,
          iconKey: 'project-icons/3f2504e0-4f89-11d3-9a0c-0305e82c3301.png',
          expiresInSeconds: 300,
        }),
      ),
      // CORS 차단처럼 응답 없이 끊기면 fetch가 TypeError로 reject 된다.
      http.put(ICON_UPLOAD_URL, () => HttpResponse.error()),
    );

    await selectIcon();

    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();
  });

  it('5MB를 넘는 파일은 올리지 않고 크기 안내를 보여 준다', async () => {
    await selectIcon(iconFile(PROJECT_ICON_MAX_SIZE + 1));

    expect(
      await screen.findByText('아이콘은 5MB 이하만 업로드할 수 있습니다.'),
    ).toBeInTheDocument();
  });
});
