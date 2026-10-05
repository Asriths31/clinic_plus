import { FiMenu } from 'react-icons/fi';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

export default function Topbar() {
  const { toggleSidebar } = useUiStore();
  const { user } = useAuthStore();

  return (
    <header className="topbar">
      <button className="topbar__menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <FiMenu size={22} />
      </button>
      <div className="topbar__spacer" />
      <div className="topbar__user">
        <span className="topbar__greeting">Welcome, <strong>{user?.name?.split(' ')[0] || 'User'}</strong></span>
        <span className="topbar__role-badge">{user?.role}</span>
      </div>
    </header>
  );
}
