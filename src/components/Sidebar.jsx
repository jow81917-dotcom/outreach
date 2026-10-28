import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bell,
  Activity,
  Video,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/prospects', label: 'Prospects', icon: Users },
  { to: '/followups', label: 'Follow-ups', icon: Bell },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 min-h-screen border-r"
      style={{
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          <Video size={15} color="white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
            OutreachTrack
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Video Editing CRM
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        Personal · Video Editing
      </div>
    </aside>
  );
}
