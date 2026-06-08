export const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL ?? 'http://localhost:3000';
export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3002';
export const STATUS_URL = process.env.NEXT_PUBLIC_STATUS_URL ?? 'http://localhost:3003';

export const NAV_LINKS = {
  client: [
    { href: '/', label: 'APIKey' },
    { href: '/clients', label: 'Client' },
    { href: '/application', label: 'Application' },
    { href: '/webhooks', label: 'Webhook' },
    { href: DOCS_URL, label: 'Docs' },
    { href: STATUS_URL, label: 'Status' },
    { href: '/myinfo', label: 'My' },
  ],
  admin: [
    { href: '/students', label: '학생' },
    { href: '/clubs', label: '동아리' },
    { href: '/projects', label: '프로젝트' },
    { href: '/api-keys', label: 'API 키' },
  ],
  docs: [
    { href: CLIENT_URL, label: 'APIKey' },
    { href: `${CLIENT_URL}/clients`, label: 'Client' },
    { href: `${CLIENT_URL}/application`, label: 'Application' },
    { href: `${CLIENT_URL}/webhooks`, label: 'Webhook' },
    { href: '/', label: 'Docs' },
    { href: STATUS_URL, label: 'Status' },
    { href: `${CLIENT_URL}/myinfo`, label: 'My' },
  ],
  status: [
    { href: CLIENT_URL, label: 'APIKey' },
    { href: `${CLIENT_URL}/clients`, label: 'Client' },
    { href: `${CLIENT_URL}/application`, label: 'Application' },
    { href: `${CLIENT_URL}/webhooks`, label: 'Webhook' },
    { href: DOCS_URL, label: 'Docs' },
    { href: '/', label: 'Status' },
    { href: `${CLIENT_URL}/myinfo`, label: 'My' },
  ],
} as const;
