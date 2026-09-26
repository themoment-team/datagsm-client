import Link from 'next/link';

import type { PublicProject } from '@repo/shared/types';
import { Badge } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import { PROJECT_STATUS_LABEL } from '@/entities/project';

interface ProjectCardProps {
  project: PublicProject;
}

const MAX_VISIBLE_TECH = 4;

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { id, name, description, status, iconUrl, club, startYear, endYear, techStacks } = project;

  return (
    <Link
      href={`/projects/${id}`}
      className={cn(
        'group border-foreground pixel-shadow bg-card flex flex-col gap-3 border-2 p-4 transition-transform hover:-translate-y-0.5',
      )}
    >
      <div className={cn('flex items-start gap-3')}>
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt={`${name} 아이콘`}
            className={cn('border-foreground h-12 w-12 flex-shrink-0 border-2 object-cover')}
          />
        ) : (
          <div
            className={cn(
              'border-foreground bg-muted text-foreground font-pixel flex h-12 w-12 flex-shrink-0 items-center justify-center border-2 text-sm',
            )}
          >
            {name.charAt(0)}
          </div>
        )}

        <div className={cn('min-w-0 flex-1')}>
          <h3 className={cn('text-foreground truncate font-semibold')}>{name}</h3>
          <p className={cn('text-muted-foreground mt-0.5 truncate font-mono text-xs')}>
            {club?.name ?? '무소속'} · {startYear}
            {endYear ? `~${endYear}` : ''}
          </p>
        </div>

        <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
          {PROJECT_STATUS_LABEL[status]}
        </Badge>
      </div>

      <p className={cn('text-muted-foreground line-clamp-2 text-sm')}>{description}</p>

      {techStacks.length > 0 && (
        <div className={cn('mt-auto flex flex-wrap gap-1')}>
          {techStacks.slice(0, MAX_VISIBLE_TECH).map((tech) => (
            <Badge key={tech} variant="outline">
              {tech}
            </Badge>
          ))}
          {techStacks.length > MAX_VISIBLE_TECH && (
            <Badge variant="outline">+{techStacks.length - MAX_VISIBLE_TECH}</Badge>
          )}
        </div>
      )}
    </Link>
  );
};

export default ProjectCard;
