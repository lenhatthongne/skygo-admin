import component from './en-US/component';
import globalHeader from './en-US/globalHeader';
import menu from './en-US/menu';
import network from './en-US/network';
import pages from './en-US/pages';
import settingDrawer from './en-US/settingDrawer';
import settings from './en-US/settings';

export default {
  'menu.overview': 'Tổng quan',
  'menu.ops': 'Vận hành',
  'menu.ops.bookings': 'Đơn đặt vé',
  'menu.ops.cancellations': 'Yêu cầu hủy',
  'menu.ops.support': 'Hộp thư hỗ trợ',
  'menu.catalog': 'Chuyến bay',
  'menu.catalog.flights': 'Chuyến bay và hạng vé',
  'menu.catalog.tickets': 'Xác minh QR vé',
  'menu.content': 'Nội dung',
  'menu.content.faqs': 'Câu hỏi thường gặp',
  'menu.content.reminders': 'Nhắc giờ bay',
  'menu.accounts': 'Khách hàng và tài khoản',
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.preview.down.block': 'Download this page to your local project',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...network,
  ...component,
  ...pages,
};
