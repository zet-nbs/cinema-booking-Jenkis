import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('public-sidebar-collapsed') === 'true');
    function toggleSidebar() {
      setSidebarCollapsed((current) => {
        const next = !current;
        localStorage.setItem('public-sidebar-collapsed', String(next));
        return next;
      });
    }
    return (<div className={`public-shell min-h-screen flex flex-col ${sidebarCollapsed ? 'public-shell-collapsed' : ''}`}>
      <Header sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
      <main className="public-content flex-1">
        <Outlet />
      </main>
      <div className="public-content">
        <Footer />
      </div>
    </div>);
}
