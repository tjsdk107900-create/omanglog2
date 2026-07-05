import PostCard from '../components/PostCard.jsx';
import Mascot from '../components/Mascot.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function MyPage({ posts }) {
  const { user, profile, signOut } = useAuth();

  return (
    <main className="page-shell mypage-grid">
      <section className="panel profile-card">
        {profile?.profile_image ? (
          <img className="profile-avatar" src={profile.profile_image} alt="프로필 이미지" />
        ) : (
          <Mascot mood="neutral" />
        )}
        <div>
          <p className="eyebrow">PROFILE</p>
          <h2>{profile?.nickname || user?.email || '오망로그 사용자'}</h2>
          <p>{user?.email}</p>
        </div>
        <button type="button" onClick={signOut}>로그아웃</button>
      </section>

      <section>
        <div className="page-section-head">
          <h2>내가 작성한 기록</h2>
        </div>
        <div className="post-list">
          {posts.slice(0, 2).map((post) => <PostCard key={post.id} post={post} compact />)}
        </div>
      </section>

      <section className="panel liked-card">
        <h2>내가 공감한 글</h2>
        <ul>
          {posts.slice(1, 4).map((post) => <li key={post.id}>{post.title}</li>)}
        </ul>
      </section>
    </main>
  );
}
