import type { PublicProject } from '@repo/shared/types';
import { Skeleton } from '@repo/shared/ui';
import { cn } from '@repo/shared/utils';

import ProjectCard from '../ProjectCard';

interface ProjectListProps {
  projects: PublicProject[];
  isLoading: boolean;
}

const SKELETON_COUNT = 6;

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

const ProjectList = ({ projects, isLoading }: ProjectListProps) => {
  if (isLoading) {
    return (
      <div className={cn(GRID_CLASS)}>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <Skeleton key={index} className={cn('border-foreground h-40 border-2')} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div
        className={cn(
          'border-foreground text-muted-foreground flex h-40 items-center justify-center border-2 border-dashed font-mono text-sm',
        )}
      >
        등록된 프로젝트가 없습니다.
      </div>
    );
  }

  return (
    <div className={cn(GRID_CLASS)}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;
