import PostCard from '../components/PostCard.jsx';
import Mascot from '../components/Mascot.jsx';

export default function MyPage({ posts }) {
  return (
    <main className="page-shell mypage-grid">
      <section className="panel profile-card">
        <Mascot mood="neutral" />
        <div>
          <p className="eyebrow">PROFILE</p>
          <h2>익명의 오망러</h2>
          <p>아직 로그인 연동 전이라 더미 프로필을 표시합니다.</p>
        </div>
        <button type="button">로그아웃</button>
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
