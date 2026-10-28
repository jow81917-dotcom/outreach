import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  Activity,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/followups', label: 'Follow-ups', icon: Bell },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--border)',
      }}
    >
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors duration-150"
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
