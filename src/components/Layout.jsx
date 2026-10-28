import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
