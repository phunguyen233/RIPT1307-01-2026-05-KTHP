import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
  products: 'Sản phẩm',
  details: 'Chi tiết',
  about: 'Giới thiệu',
  contact: 'Liên hệ',
  branches: 'Chi nhánh',
  cart: 'Giỏ hàng',
  'orders-history': 'Đơn hàng',
  auth: 'Đăng nhập',
};

type BreadcrumbsProps = {
  currentName?: string;
};

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentName }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  let path = '';
  const items = segments.reduce<Array<{ label: string; to?: string }>>((acc, segment, index) => {
    const isLast = index === segments.length - 1;

    if (segment === 'details' && index === segments.length - 2) {
      return acc;
    }

    path += `/${segment}`;
    let label = routeLabels[segment] || segment.replace(/-/g, ' ');

    if (/^\d+$/.test(segment) && currentName) {
      label = currentName;
    }

    acc.push({
      label,
      to: isLast ? undefined : path,
    });
    return acc;
  }, []);

  return (
    <nav className="mb-6 text-sm text-text/60" aria-label="breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/" className="inline-flex items-center gap-1 text-text/60 hover:text-danger transition-colors">
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            {item.to ? (
              <Link to={item.to} className="text-text/60 hover:text-danger transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-text font-semibold">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
