import { NavLink } from 'react-router-dom';
import { FiGrid, FiUsers, FiUserCheck, FiCalendar, FiLogOut, FiX } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUiStore();

  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  // Role-based navigation items
  const navItems = [
    { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    {
      to: '/appointments',
      icon: FiCalendar,
      label: isPatient ? 'My Appointments' : (isDoctor ? 'My Consultations' : 'Appointments'),
    },
    ...(isAdmin
      ? [
          { to: '/patients', icon: FiUsers, label: 'Patients' },
          { to: '/doctors', icon: FiUserCheck, label: 'Doctors' },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    closeSidebar();
  };

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <span className="sidebar__brand-icon">✚</span>
            <span className="sidebar__brand-text">Clinic Plus</span>
          </div>
          <button className="sidebar__close" onClick={closeSidebar} aria-label="Close sidebar">
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.name?.[0] || 'U'}</div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">
                {isDoctor && !user?.name?.startsWith('Dr.') ? ` ${user?.name}` : user?.name || 'User'}
              </span>
              <span className="sidebar__user-role">{user?.role || 'Guest'}</span>
            </div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} aria-label="Logout">
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
