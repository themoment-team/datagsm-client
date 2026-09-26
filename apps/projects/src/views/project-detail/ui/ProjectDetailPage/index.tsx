'use client';

import Link from 'next/link';

import { ArrowLeft, ExternalLink } from 'lucide-react';

import { Badge, Button, Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import {
  PROJECT_DEPLOYMENT_URL_PATTERN,
  PROJECT_STATUS_LABEL,
  STUDENT_MAJOR_LABEL,
} from '@/entities/project';
import { useGetPublicProject } from '@/views/project-detail/model/useGetPublicProject';

interface ProjectDetailPageProps {
  projectId: number;
}

const ProjectDetailPage = ({ projectId }: ProjectDetailPageProps) => {
  const { data, isLoading, isError } = useGetPublicProject(projectId);
  const project = data?.data;
  // 서버가 http(s)만 저장하지만, href에 넣는 값이라 한 번 더 걸러 javascript: 같은 스킴을 막는다.
  const deploymentUrl =
    project?.deploymentUrl && PROJECT_DEPLOYMENT_URL_PATTERN.test(project.deploymentUrl)
      ? project.deploymentUrl
      : null;

  return (
    <div className={cn('bg-background min-h-[calc(100vh-3.5rem)]')}>
      <main className={cn('container mx-auto max-w-3xl px-4 py-8')}>
        <Link
          href="/"
          className={cn(
            'text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest',
          )}
        >
          <ArrowLeft className={cn('h-3 w-3')} /> 목록으로
        </Link>

        {isLoading && <Skeleton className={cn('border-foreground h-64 border-2')} />}

        {isError && (
          <div
            className={cn(
              'border-foreground text-muted-foreground flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
            )}
          >
            프로젝트를 찾을 수 없습니다.
          </div>
        )}

        {project && (
          <article className={cn('flex flex-col gap-6')}>
            <header className={cn('flex items-start gap-4')}>
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
                  <h1 className={cn('text-foreground text-xl font-bold')}>{project.name}</h1>
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
            </header>

            <section>
              <p className={cn('text-foreground whitespace-pre-wrap text-sm leading-relaxed')}>
                {project.description}
              </p>
            </section>

            {project.techStacks.length > 0 && (
              <section className={cn('flex flex-col gap-2')}>
                <h2 className={cn('text-foreground font-mono text-xs uppercase tracking-widest')}>
                  기술 스택
                </h2>
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
                <h2 className={cn('text-foreground font-mono text-xs uppercase tracking-widest')}>
                  참여자
                </h2>
                <ul className={cn('flex flex-wrap gap-2')}>
                  {project.participants.map((participant, index) => (
                    <li
                      key={`${participant.name}-${index}`}
                      className={cn('border-foreground flex items-center gap-1.5 border px-2 py-1 text-sm')}
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
                <h2 className={cn('text-foreground font-mono text-xs uppercase tracking-widest')}>
                  리포지토리
                </h2>
                <ul className={cn('flex flex-col gap-1')}>
                  {project.repositories.map((repo) => (
                    <li key={repo}>
                      <a
                        href={repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'text-muted-foreground hover:text-foreground inline-flex items-center gap-1 break-all font-mono text-xs',
                        )}
                      >
                        <ExternalLink className={cn('h-3 w-3 flex-shrink-0')} /> {repo}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );
};

export default ProjectDetailPage;
