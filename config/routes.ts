const page = (path: string, icon: string, component: string) => ({
  path,
  name: path.slice(1),
  icon,
  component: `./skygo/${component}`,
  access: 'canAdmin',
});
const group = (
  name: string,
  icon: string,
  routes: ReturnType<typeof page>[],
) => ({
  path: `/${name}`,
  name,
  icon,
  access: 'canAdmin',
  routes: routes.map((r) => ({ ...r, name: r.name })),
});
export default [
  { path: '/user/login', layout: false, component: './user/login' },
  page('/overview', 'dashboard', 'Overview'),
  group('ops', 'inbox', [
    page('/bookings', 'profile', 'Bookings'),
    page('/cancellations', 'stop', 'Cancellations'),
    page('/support', 'customerService', 'Support'),
  ]),
  group('catalog', 'rocket', [
    page('/flights', 'rocket', 'Flights'),
    page('/tickets', 'qrcode', 'Tickets'),
  ]),
  group('content', 'read', [
    page('/faqs', 'questionCircle', 'Faqs'),
    page('/reminders', 'bell', 'Reminders'),
  ]),
  page('/accounts', 'team', 'Accounts'),
  { path: '/', redirect: '/overview' },
  { path: '*', layout: false, component: './exception/404' },
];
