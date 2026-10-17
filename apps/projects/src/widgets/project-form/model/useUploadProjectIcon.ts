import { meProjectQueryKeys, meProjectUrl, post } from '@repo/shared/api';
import type { IconUploadUrlResponse, ProjectIconContentType } from '@repo/shared/types';
import { useMutation } from '@tanstack/react-query';

import { PROJECT_ICON_ALLOWED_TYPES, PROJECT_ICON_MAX_SIZE } from '@/entities/project';

/**
 * 아이콘 업로드: presigned URL을 발급받아 S3에 직접 PUT 한다.
 * S3 요청에는 인증 헤더를 붙이지 않고, 서명에 포함된 Content-Type만 동일하게 맞춘다.
 * 성공 시 신청 API에 전달할 iconKey를 반환한다.
 */
export const useUploadProjectIcon = () =>
  useMutation({
    mutationKey: meProjectQueryKeys.postIconUploadUrl(),
    mutationFn: async (file: File): Promise<string> => {
      const contentType = file.type as ProjectIconContentType;

      if (!PROJECT_ICON_ALLOWED_TYPES.includes(contentType)) {
        throw new Error('PNG, JPEG, WEBP, GIF 형식만 업로드할 수 있습니다.');
      }

      if (file.size > PROJECT_ICON_MAX_SIZE) {
        throw new Error('아이콘은 5MB 이하만 업로드할 수 있습니다.');
      }

      const { data } = await post<IconUploadUrlResponse>(meProjectUrl.postIconUploadUrl(), {
        contentType,
        contentLength: file.size,
      });

      const uploadResponse = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('아이콘 업로드에 실패했습니다.');
      }

      return data.iconKey;
    },
  });
