import { Badge } from 'antd';
import type React from 'react';
import { useOverview } from './overviewStore';

/** A red count beside a menu entry that has work waiting (replies, cancellations). */
export function MenuBadge({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const { value } = useOverview();
  const count =
    path === '/support'
      ? value?.supportWaiting
      : path === '/cancellations'
        ? value?.cancelRequests
        : 0;
  if (!count) return <>{children}</>;
  return (
    <Badge count={count} size="small" offset={[10, 0]} overflowCount={99}>
      {children}
    </Badge>
  );
}
