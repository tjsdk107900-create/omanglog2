import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import PostCard from '../components/PostCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toggleFollow } from '../lib/follows.js';
import { searchAll } from '../lib/search.js';

const DEBOUNCE_MS = 350;

export default function SearchPage({
  onToggleLike,
  likePendingByPostId,
  currentUserId,
  onDeletePost,
  postActionPendingByPostId,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followPendingByUserId, setFollowPendingByUserId] = useState({});
  const requestIdRef = useRef(0);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      if (query.trim()) {
        setSearchParams({ q: query.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, setSearchParams]);

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!normalizedQuery) {
      setUsers([]);
      setPosts([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    searchAll(normalizedQuery, currentUserId)
      .then((result) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setUsers(result.users);
        setPosts(result.posts);
      })
      .catch((searchError) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        console.error('[Supabase] search failed', searchError);
        setUsers([]);
        setPosts([]);
        setError(searchError.message || '검색 중 오류가 발생했습니다.');
      })
      .finally(() => {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentUserId]);

  const handleToggleFollow = async (targetUser) => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (targetUser.id === user.id || followPendingByUserId[targetUser.id]) return;

    const nextFollowing = !targetUser.isFollowing;
    setFollowPendingByUserId((current) => ({ ...current, [targetUser.id]: true }));
    setUsers((currentUsers) => currentUsers.map((item) => (
      item.id === targetUser.id ? { ...item, isFollowing: nextFollowing, followError: '' } : item
    )));

    try {
      await toggleFollow({
        currentUserId: user.id,
        targetUserId: targetUser.id,
        isFollowing: targetUser.isFollowing,
      });
    } catch (followError) {
      console.error('[Supabase] search follow toggle failed', followError);
      setUsers((currentUsers) => currentUsers.map((item) => (
        item.id === targetUser.id
          ? {
            ...item,
            isFollowing: targetUser.isFollowing,
            followError: followError.message || '팔로우 처리 중 오류가 발생했습니다.',
          }
          : item
      )));
    } finally {
      setFollowPendingByUserId((current) => {
        const next = { ...current };
        delete next[targetUser.id];
        return next;
      });
    }
  };

  const hasQuery = Boolean(debouncedQuery);
  const hasResults = users.length || posts.length;

  return (
    <main className="page-shell search-page">
      <section className="panel search-panel">
        <label className="search search-page-input">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="태그, 키워드, 사용자 검색"
            autoFocus
          />
        </label>
      </section>

      {!hasQuery ? (
        <section className="panel empty-card">
          <h2>검색어를 입력해주세요.</h2>
        </section>
      ) : null}

      {loading ? (
        <section className="panel empty-card">
          <h2>검색 중입니다.</h2>
        </section>
      ) : null}

      {error ? (
        <section className="panel empty-card">
          <h2>검색하지 못했습니다.</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {hasQuery && !loading && !error && !hasResults ? (
        <section className="panel empty-card">
          <h2>검색 결과가 없습니다.</h2>
        </section>
      ) : null}

      {!loading && !error && users.length ? (
        <section className="search-results-section">
          <div className="page-section-head">
            <h2>사용자</h2>
          </div>
          <div className="user-result-list">
            {users.map((item) => {
              const isMe = item.id === currentUserId;
              return (
                <article className="panel user-result-card" key={item.id}>
                  <Link to={`/users/${item.id}`}>
                    {item.profileImage ? (
                      <img className="profile-avatar" src={item.profileImage} alt="" />
                    ) : (
                      <Mascot mood="mini" />
                    )}
                    <div>
                      <h3>{item.nickname}</h3>
                      <p>{item.identifier}</p>
                      {item.bio ? <span>{item.bio}</span> : null}
                    </div>
                  </Link>
                  {!isMe ? (
                    <button
                      type="button"
                      disabled={Boolean(followPendingByUserId[item.id] || item.followError)}
                      onClick={() => handleToggleFollow(item)}
                    >
                      {item.isFollowing ? '팔로잉' : '팔로우'}
                    </button>
                  ) : null}
                  {item.followError ? <p className="post-inline-error">{item.followError}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {!loading && !error && posts.length ? (
        <section className="search-results-section">
          <div className="page-section-head">
            <h2>게시글</h2>
          </div>
          <div className="post-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={onToggleLike}
                likePending={Boolean(likePendingByPostId[post.id])}
                currentUserId={currentUserId}
                onDeletePost={onDeletePost}
                postActionPending={Boolean(postActionPendingByPostId[post.id])}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
