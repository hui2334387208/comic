export interface MenuItem {
  key: string;
  label: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'admin.sidebar.dashboard',
    path: '/admin/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'content',
    label: 'admin.sidebar.content',
    path: '/admin/content',
    icon: 'file',
    children: [
      // {
      //   key: 'articles',
      //   label: 'admin.content.articleList',
      //   path: '/admin/content/articles'
      // },
      // {
      //   key: 'categories',
      //   label: 'admin.content.categoryManagement',
      //   path: '/admin/content/categories'
      // },
      // {
      //   key: 'tags',
      //   label: 'admin.content.tagManagement',
      //   path: '/admin/content/tags'
      // },
      // {
      //   key: 'banners',
      //   label: 'admin.content.bannerManagement',
      //   path: '/admin/content/banners'
      // },
      {
        key: 'videos',
        label: 'admin.sidebar.videoManagement',
        path: '/admin/videos',
      },
      {
        key: 'resources',
        label: 'admin.sidebar.resourceManagement',
        path: '/admin/resources',
      },
    ],
  },
  {
    key: 'couplet-management',
    label: 'admin.sidebar.coupletManagement',
    path: '/admin/couplets',
    icon: 'book',
    children: [
      {
        key: 'couplets',
        label: 'admin.sidebar.coupletList',
        path: '/admin/couplets',
      },
      {
        key: 'couplet-categories',
        label: 'admin.sidebar.coupletCategories',
        path: '/admin/couplets/categories',
      },
      {
        key: 'couplet-tags',
        label: 'admin.sidebar.coupletTags',
        path: '/admin/couplets/tags',
      },
    ],
  },
  {
    key: 'education',
    label: 'admin.sidebar.educationManagement',
    path: '/admin/education',
    icon: 'book',
    children: [
      {
        key: 'education-courses',
        label: 'admin.sidebar.courseManagement',
        path: '/admin/education/courses'
      },
      {
        key: 'education-exercises',
        label: 'admin.sidebar.exerciseManagement',
        path: '/admin/education/exercises'
      },
      {
        key: 'education-paths',
        label: 'admin.sidebar.learningPathManagement',
        path: '/admin/education/paths'
      },
      {
        key: 'education-badges',
        label: 'admin.sidebar.badgeManagement',
        path: '/admin/education/badges'
      },
      {
        key: 'education-stats',
        label: 'admin.sidebar.learningStats',
        path: '/admin/education/stats'
      },
      {
        key: 'education-init',
        label: 'admin.sidebar.educationInit',
        path: '/admin/education-init'
      }
    ],
  },
  {
    key: 'vip',
    label: 'admin.sidebar.vipManagement',
    path: '/admin/vip',
    icon: 'vip',
    children: [
      {
        key: 'orders',
        label: 'admin.sidebar.vipOrders',
        path: '/admin/vip/orders',
      },
      {
        key: 'plans',
        label: 'admin.sidebar.vipPlans',
        path: '/admin/vip/plans',
      },
      {
        key: 'redeem',
        label: 'admin.sidebar.vipRedeem',
        path: '/admin/vip/redeem',
      },
      {
        key: 'redeem-history',
        label: 'admin.sidebar.vipRedeemHistory',
        path: '/admin/vip/redeem/history',
      },
    ],
  },
  {
    key: 'feedback',
    label: 'admin.sidebar.feedback',
    path: '/admin/feedback',
    icon: 'message',
  },
  {
    key: 'settings',
    label: 'admin.sidebar.system',
    path: '/admin/settings',
    icon: 'setting',
    children: [
      {
        key: 'site-settings',
        label: 'admin.settings.title',
        path: '/admin/settings',
      },
      {
        key: 'system-logs',
        label: 'admin.systemLogs.title',
        path: '/admin/system/logs',
      },
      {
        key: 'sitemap',
        label: 'admin.sitemap.title',
        path: '/admin/system/sitemap',
      },
    ],
  },
  {
    key: 'main-menus',
    label: 'admin.sidebar.mainMenus',
    path: '/admin/main-menus',
    icon: 'menu',
  },
]
