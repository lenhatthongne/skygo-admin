import component from './zh-CN/component';
import globalHeader from './zh-CN/globalHeader';
import menu from './zh-CN/menu';
import network from './zh-CN/network';
import pages from './zh-CN/pages';
import settingDrawer from './zh-CN/settingDrawer';
import settings from './zh-CN/settings';

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
  'navBar.lang': '语言',
  'layout.user.link.help': '帮助',
  'layout.user.link.privacy': '隐私',
  'layout.user.link.terms': '条款',
  'app.preview.down.block': '下载此页面到本地项目',
  ...pages,
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...network,
  ...component,
};
