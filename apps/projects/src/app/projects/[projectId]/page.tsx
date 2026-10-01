import { notFound } from 'next/navigation';

import { ProjectDetailPage } from '@/views/project-detail';

interface ProjectDetailRouteProps {
  params: Promise<{ projectId: string }>;
}

const ProjectDetailRoute = async ({ params }: ProjectDetailRouteProps) => {
  const { projectId } = await params;
  const parsedId = Number(projectId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound();
  }

  return <ProjectDetailPage projectId={parsedId} />;
};

export default ProjectDetailRoute;
