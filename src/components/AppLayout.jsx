import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Home, LineChart, LogOut, Menu, PenLine, Search, Trophy, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import Mascot from './Mascot.jsx';

const navItems = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/feed', label: '피드', icon: Menu },
  { to: '/stats', label: '통계', icon: LineChart },
  { to: '/ranking', label: '랭킹', icon: Trophy },
  { to: '/mypage', label: '마이', icon: UserRound },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <button className="brand brand-link" type="button" onClick={() => navigate('/')}>
          <h1>오망로그</h1>
          <span>OMANG LOG</span>
        </button>

        <button className="record-button" type="button" onClick={() => navigate('/write')}>
          <PenLine size={24} />
          기록하기
          <span className="badge">3초 컷</span>
        </button>

        <nav className="side-nav" aria-label="주요 메뉴">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <NavLink to="/omang-card">
            <Mascot mood="mini" />
            오망카드
          </NavLink>
        </nav>

        <section className="install-card panel">
          <strong>오늘의 오망을 남겨보세요</strong>
          <p>가볍게 기록하고, 나중에 카드와 통계로 다시 확인할 수 있어요.</p>
          <button className="small-button" type="button" onClick={() => navigate('/write')}>바로 쓰기</button>
          <div className="phone">
            <Mascot mood="neutral" />
            <span>+</span>
          </div>
        </section>
      </aside>

      <div className="content">
        <header className="top-nav compact-top-nav">
          <div className="top-tools">
            <label className="search">
              <Search size={18} />
              <input placeholder="태그, 키워드 검색" />
            </label>
            <button className="bell icon-only" type="button" aria-label="알림">
              <Bell size={24} />
              <span>2</span>
            </button>
            <button className="avatar icon-only" type="button" onClick={() => navigate('/mypage')} aria-label="프로필">
              <Mascot mood="mini" />
            </button>
            <button className="logout-button icon-only" type="button" onClick={handleSignOut} aria-label="로그아웃">
              <LogOut size={22} />
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
