import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import Mascot from '../components/Mascot.jsx';
import PostListState from '../components/PostListState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchFollowList, fetchUserProfile } from '../lib/follows.js';

function MyFollowList({ profileId, type, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadItems() {
      setLoading(true);
      setError('');

      try {
        const nextItems = await fetchFollowList(profileId, type);
        if (mounted) setItems(nextItems);
      } catch (loadError) {
        console.error('[Supabase] follow list load failed', loadError);
        if (mounted) setError(loadError.message || '목록을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadItems();

    return () => {
      mounted = false;
    };
  }, [profileId, type]);

  return (
    <section className="panel follow-list-card">
      <div className="page-section-head">
        <h2>{type === 'followers' ? '팔로워' : '팔로잉'}</h2>
        <button type="button" onClick={onClose}>닫기</button>
      </div>
      {loading ? <p className="comments-state">목록을 불러오는 중입니다.</p> : null}
      {error ? <p className="post-inline-error">{error}</p> : null}
      {!loading && !error && !items.length ? <p className="comments-state">아직 표시할 사용자가 없습니다.</p> : null}
      {!loading && !error && items.length ? (
        <ul className="follow-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`/users/${item.id}`} onClick={onClose}>
                {item.profileImage ? (
                  <img className="profile-avatar comment-avatar" src={item.profileImage} alt="" />
                ) : (
                  <Mascot mood="mini" />
                )}
                <b>{item.nickname}</b>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function MyPage({
  posts,
  postsLoading,
  postsError,
  onRetryPosts,
  onToggleLike,
  likePendingByPostId,
  currentUserId,
  onDeletePost,
  postActionPendingByPostId,
}) {
  const { user, profile, signOut } = useAuth();
  const [followCounts, setFollowCounts] = useState({ followerCount: 0, followingCount: 0, error: '' });
  const [openList, setOpenList] = useState('');
  const myPosts = posts.filter((post) => post.authorId === user?.id);
  const likedPosts = posts.filter((post) => post.likedByMe);

  useEffect(() => {
    let mounted = true;

    async function loadCounts() {
      if (!user?.id) return;

      try {
        const nextProfile = await fetchUserProfile(user.id, user.id);
        if (mounted && nextProfile) {
          setFollowCounts({
            followerCount: nextProfile.followerCount,
            followingCount: nextProfile.followingCount,
            error: nextProfile.followError,
          });
        }
      } catch (error) {
        console.error('[Supabase] my follow counts load failed', error);
        if (mounted) setFollowCounts((current) => ({ ...current, error: error.message }));
      }
    }

    loadCounts();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

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
          <div className="follow-stats">
            <button type="button" onClick={() => setOpenList('followers')}>
              팔로워 <b>{followCounts.followerCount}</b>
            </button>
            <button type="button" onClick={() => setOpenList('following')}>
              팔로잉 <b>{followCounts.followingCount}</b>
            </button>
          </div>
          {followCounts.error ? <p className="post-inline-error">{followCounts.error}</p> : null}
        </div>
        <button type="button" onClick={signOut}>로그아웃</button>
      </section>

      {openList ? <MyFollowList profileId={user.id} type={openList} onClose={() => setOpenList('')} /> : null}

      <section>
        <div className="page-section-head">
          <h2>내가 작성한 기록</h2>
        </div>
        <div className="post-list">
          <PostListState
            loading={postsLoading}
            error={postsError}
            empty={!myPosts.length}
            onRetry={onRetryPosts}
          />
          {!postsLoading && !postsError
            ? myPosts.slice(0, 2).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                compact
                onToggleLike={onToggleLike}
                likePending={Boolean(likePendingByPostId[post.id])}
                currentUserId={currentUserId}
                onDeletePost={onDeletePost}
                postActionPending={Boolean(postActionPendingByPostId[post.id])}
              />
            ))
            : null}
        </div>
      </section>

      <section className="panel liked-card">
        <h2>내가 공감한 글</h2>
        {postsLoading ? <p className="comments-state">공감한 글을 불러오는 중입니다.</p> : null}
        {postsError ? <p className="post-inline-error">{postsError}</p> : null}
        {!postsLoading && !postsError && !likedPosts.length ? (
          <p className="comments-state">아직 공감한 글이 없습니다.</p>
        ) : null}
        {!postsLoading && !postsError && likedPosts.length ? (
          <ul>
            {likedPosts.slice(0, 5).map((post) => (
              <li key={post.id}>
                <Link to={`/post/${post.id}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
