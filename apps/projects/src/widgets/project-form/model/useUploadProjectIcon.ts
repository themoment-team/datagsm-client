import { meProjectQueryKeys, meProjectUrl, post } from '@repo/shared/api';
import type { IconUploadUrlResponse, ProjectIconContentType } from '@repo/shared/types';
import { getApiErrorMessage } from '@repo/shared/utils';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { PROJECT_ICON_ALLOWED_TYPES, PROJECT_ICON_MAX_SIZE } from '@/entities/project';

const UPLOAD_FAILED_MESSAGE = '아이콘 업로드에 실패했습니다.';
const NETWORK_ERROR_MESSAGE =
  '아이콘을 올리지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.';

/**
 * 화면에 그대로 보여 줄 한국어 안내를 담은 업로드 오류.
 * axios·fetch 오류의 message는 영문이라 업로드 중 실패는 모두 이 오류로 바꿔 던진다.
 */
export class ProjectIconUploadError extends Error {
  name = 'ProjectIconUploadError';
}

/**
 * 업로드 URL 발급 실패 안내. 요청 횟수 제한(429)처럼 서버가 안내를 주면 그대로 쓰고,
 * 응답을 받지 못했으면(시간 초과·네트워크 오류) 네트워크 상태를 확인하도록 안내한다.
 */
const getUploadUrlErrorMessage = (error: unknown) => {
  const serverMessage = getApiErrorMessage(error);
  if (serverMessage) return serverMessage;
  if (error instanceof AxiosError && !error.response) return NETWORK_ERROR_MESSAGE;
  return UPLOAD_FAILED_MESSAGE;
};

/**
 * 아이콘 업로드: presigned URL을 발급받아 S3에 직접 PUT 한다.
 * S3 요청에는 인증 헤더를 붙이지 않고, 서명에 포함된 Content-Type만 동일하게 맞춘다.
 * 성공 시 신청 API에 전달할 iconKey를 반환하고, 실패하면 ProjectIconUploadError를 던진다.
 */
export const useUploadProjectIcon = () =>
  useMutation({
    mutationKey: meProjectQueryKeys.postIconUploadUrl(),
    mutationFn: async (file: File): Promise<string> => {
      const contentType = file.type as ProjectIconContentType;

      if (!PROJECT_ICON_ALLOWED_TYPES.includes(contentType)) {
        throw new ProjectIconUploadError('PNG, JPEG, WEBP, GIF 형식만 업로드할 수 있습니다.');
      }

      if (file.size > PROJECT_ICON_MAX_SIZE) {
        throw new ProjectIconUploadError('아이콘은 5MB 이하만 업로드할 수 있습니다.');
      }

      const { data } = await post<IconUploadUrlResponse>(meProjectUrl.postIconUploadUrl(), {
        contentType,
        contentLength: file.size,
      }).catch((error: unknown) => {
        throw new ProjectIconUploadError(getUploadUrlErrorMessage(error), { cause: error });
      });

      // 응답을 받지 못하면(CORS 차단·네트워크 오류) fetch는 TypeError로 reject 되고,
      // message('Failed to fetch' 등)는 브라우저마다 다르다.
      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      }).catch((error: unknown) => {
        throw new ProjectIconUploadError(NETWORK_ERROR_MESSAGE, { cause: error });
      });

      if (!uploadResponse.ok) {
        throw new ProjectIconUploadError(UPLOAD_FAILED_MESSAGE);
      }

      return data.iconKey;
    },
  });
