export const siteConfig: SitesConfig = {
  title: 'PocketWebAnalytics',
  titleTemplate: '%s | PocketWebAnalytics',
  description:
    'Modern, production-ready web analytics platform built with Next.js 15, TypeScript, and Chakra UI v3',
  language: 'en',
  url: 'https://pocketwebanalytics.vercel.app',
  repoUrl: 'https://github.com/kingchun1991/pocketWebAnalytics',
  repoBranch: 'main',
  donationUrl: 'https://opencollective.com/chakra-ui',
  navigation: [
    {
      title: 'Blog',
      url: '/blog',
    },
    { title: 'Tags', url: '/tags' },
    { title: 'About', url: '/about' },
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Login', url: '/login' },
  ],
};

export const giscusConfig: GiscusConfig = {
  repo: 'kingchun1991/pocketWebAnalytics',
  repo_id: 'R_kgDOJ2sHHw', // You may need to update this with the correct repo ID for PocketWebAnalytics
};

interface GiscusConfig {
  repo: string;
  repo_id: string;
}

interface SitesConfig {
  title: string;
  titleTemplate: string;
  description: string;
  language: string;
  url: string;
  repoUrl: string;
  donationUrl: string;
  navigation: NavItem[];
  repoBranch: string;
}

export interface NavItem {
  title: string;
  url?: string;
  external?: boolean;
  status?: string;
  children?: NavItem[];
}
