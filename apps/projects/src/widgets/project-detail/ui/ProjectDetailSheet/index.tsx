'use client';

import { useState } from 'react';

import type { PublicProject } from '@repo/shared/types';
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@repo/shared/ui';
import { cn, getSafeUrl } from '@repo/shared/utils';
import { ExternalLink } from 'lucide-react';

import { PROJECT_STATUS_LABEL, STUDENT_MAJOR_LABEL } from '@/entities/project';

import { useGetPublicProject } from '../../model/useGetPublicProject';

interface ProjectDetailSheetProps {
  /** null이면 시트를 닫는다 */
  projectId: number | null;
  /** 목록에서 연 경우 이미 받은 데이터를 먼저 보여 준다 */
  initialProject?: PublicProject;
  onClose: () => void;
}

const SECTION_TITLE_STYLE = 'text-foreground font-mono text-xs uppercase tracking-widest';
const REPOSITORY_STYLE =
  'text-muted-foreground inline-flex items-center gap-1 break-all font-mono text-xs';

const ProjectDetailSheet = ({ projectId, initialProject, onClose }: ProjectDetailSheetProps) => {
  // 닫히는 애니메이션 동안 내용이 비지 않도록 마지막으로 연 프로젝트를 기억해 둔다.
  const [shown, setShown] = useState<{ id: number; initial?: PublicProject } | null>(null);
  if (projectId !== null && (shown?.id !== projectId || (!shown.initial && initialProject))) {
    setShown({ id: projectId, initial: initialProject });
  }

  const { data, isError } = useGetPublicProject(shown?.id ?? 0, { enabled: shown !== null });
  const project = data?.data ?? shown?.initial;

  return (
    <Sheet open={projectId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className={cn('gap-0 p-0 sm:max-w-xl')}>
        {project ? (
          <ProjectDetail project={project} />
        ) : (
          <div className={cn('flex flex-col gap-4 p-6')}>
            <SheetTitle className={cn('sr-only')}>프로젝트 상세</SheetTitle>
            {isError ? (
              <div
                className={cn(
                  'border-foreground text-muted-foreground mt-8 flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
                )}
              >
                프로젝트를 찾을 수 없습니다.
              </div>
            ) : (
              <Skeleton className={cn('border-foreground mt-8 h-64 border-2')} />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const ProjectDetail = ({ project }: { project: PublicProject }) => {
  // 서버가 http(s)만 저장하지만, href에 넣는 값이라 한 번 더 걸러 javascript: 같은 스킴을 막는다.
  const deploymentUrl = getSafeUrl(project.deploymentUrl);

  return (
    <>
      <SheetHeader className={cn('border-foreground shrink-0 border-b-2 px-6 py-5 pr-14')}>
        <div className={cn('flex items-start gap-4')}>
          {project.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.iconUrl}
              alt={`${project.name} 아이콘`}
              className={cn('border-foreground h-16 w-16 flex-shrink-0 border-2 object-cover')}
            />
          ) : (
            <div
              className={cn(
                'border-foreground bg-muted text-foreground font-pixel flex h-16 w-16 flex-shrink-0 items-center justify-center border-2',
              )}
            >
              {project.name.charAt(0)}
            </div>
          )}

          <div className={cn('min-w-0 flex-1')}>
            <div className={cn('flex flex-wrap items-center gap-2')}>
              <SheetTitle className={cn('text-foreground text-xl font-bold leading-tight')}>
                {project.name}
              </SheetTitle>
              <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {PROJECT_STATUS_LABEL[project.status]}
              </Badge>
            </div>
            <p className={cn('text-muted-foreground mt-1 font-mono text-xs')}>
              {project.club?.name ?? '무소속'} · {project.startYear}
              {project.endYear ? `~${project.endYear}` : ''}
            </p>
            {deploymentUrl && (
              <Button asChild variant="outline" size="sm" className={cn('mt-3 gap-1.5')}>
                <a
                  href={deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={deploymentUrl}
                >
                  <ExternalLink className={cn('h-3.5 w-3.5')} />
                  사이트 방문
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetHeader>

      <div className={cn('flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6')}>
        <section>
          <p className={cn('text-foreground whitespace-pre-wrap text-sm leading-relaxed')}>
            {project.description}
          </p>
        </section>

        {project.techStacks.length > 0 && (
          <section className={cn('flex flex-col gap-2')}>
            <h3 className={cn(SECTION_TITLE_STYLE)}>기술 스택</h3>
            <div className={cn('flex flex-wrap gap-1')}>
              {project.techStacks.map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {project.participants.length > 0 && (
          <section className={cn('flex flex-col gap-2')}>
            <h3 className={cn(SECTION_TITLE_STYLE)}>참여자</h3>
            <ul className={cn('flex flex-wrap gap-2')}>
              {project.participants.map((participant, index) => (
                <li
                  key={`${participant.name}-${index}`}
                  className={cn(
                    'border-foreground flex items-center gap-1.5 border px-2 py-1 text-sm',
                  )}
                >
                  <span className={cn('text-foreground')}>{participant.name}</span>
                  <span className={cn('text-muted-foreground font-mono text-xs')}>
                    {STUDENT_MAJOR_LABEL[participant.major]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {project.repositories.length > 0 && (
          <section className={cn('flex flex-col gap-2')}>
            <h3 className={cn(SECTION_TITLE_STYLE)}>리포지토리</h3>
            <ul className={cn('flex flex-col gap-1')}>
              {project.repositories.map((repo) => {
                // 서버가 리포지토리 스킴을 검사하지 않아, http(s)가 아니면 링크 대신 글자로만 보여 준다.
                const repoUrl = getSafeUrl(repo);

                return (
                  <li key={repo}>
                    {repoUrl ? (
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(REPOSITORY_STYLE, 'hover:text-foreground')}
                      >
                        <ExternalLink className={cn('h-3 w-3 flex-shrink-0')} /> {repo}
                      </a>
                    ) : (
                      <span className={cn(REPOSITORY_STYLE)}>{repo}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
};

export default ProjectDetailSheet;
