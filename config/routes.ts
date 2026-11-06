const page = (name: string, icon: string, component: string, base = '') => ({
  path: `${base}/${name}`,
  name,
  icon,
  component: `./skygo/${component}`,
  access: 'canAdmin',
});
// A child path must start with its group's path, so /bookings lives at /ops/bookings. The old flat
// addresses redirect, so bookmarks and links keep working.
const group = (
  name: string,
  icon: string,
  first: string,
  pages: [string, string, string][],
) => [
  {
    path: `/${name}`,
    name,
    icon,
    access: 'canAdmin',
    routes: [
      { path: `/${name}`, redirect: `/${name}/${first}` },
      ...pages.map(([page_, pageIcon, component]) =>
        page(page_, pageIcon, component, `/${name}`),
      ),
    ],
  },
  ...pages.map(([page_]) => ({
    path: `/${page_}`,
    redirect: `/${name}/${page_}`,
  })),
];
export default [
  { path: '/user/login', layout: false, component: './user/login' },
  page('overview', 'dashboard', 'Overview'),
  ...group('ops', 'inbox', 'bookings', [
    ['bookings', 'profile', 'Bookings'],
    ['cancellations', 'stop', 'Cancellations'],
    ['support', 'customerService', 'Support'],
  ]),
  ...group('catalog', 'rocket', 'flights', [
    ['flights', 'rocket', 'Flights'],
    ['tickets', 'qrcode', 'Tickets'],
  ]),
  ...group('content', 'read', 'faqs', [
    ['faqs', 'questionCircle', 'Faqs'],
    ['reminders', 'bell', 'Reminders'],
  ]),
  page('accounts', 'team', 'Accounts'),
  { path: '/', redirect: '/overview' },
  { path: '*', layout: false, component: './exception/404' },
];
