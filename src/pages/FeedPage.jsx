import { useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import PostListState from '../components/PostListState.jsx';
import { cleanTagName, formatTagLabel } from '../lib/tags.js';

export default function FeedPage({
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = cleanTagName(searchParams.get('tag') ?? '');
  const sortParam = searchParams.get('sort');
  const sort = sortParam === 'popular' ? 'popular' : 'latest';

  useEffect(() => {
    if (sortParam && sortParam !== 'latest' && sortParam !== 'popular') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('sort', 'latest');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, sortParam]);

  const updateSort = (nextSort) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', nextSort);
    setSearchParams(nextParams);
  };

  const visiblePosts = useMemo(() => {
    const filteredPosts = activeTag
      ? posts.filter((post) => post.tags.includes(activeTag))
      : posts;

    return [...filteredPosts].sort((a, b) => {
      if (sort === 'popular') {
        const likeDelta = Number(b.empathy ?? 0) - Number(a.empathy ?? 0);
        if (likeDelta !== 0) return likeDelta;
      }

      const timeDelta = Number(b.createdAtMs ?? 0) - Number(a.createdAtMs ?? 0);
      if (timeDelta !== 0) return timeDelta;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [activeTag, posts, sort]);

  return (
    <main className="page-shell">
      <div className="feed-tabs">
        <div>
          <button className="active" type="button">전체 피드</button>
          <button type="button">팔로잉</button>
        </div>
        <div className="feed-sort" aria-label="피드 정렬">
          <button
            className={sort === 'latest' ? 'active' : ''}
            type="button"
            onClick={() => updateSort('latest')}
          >
            최신순 <ChevronDown size={15} />
          </button>
          <button
            className={sort === 'popular' ? 'active' : ''}
            type="button"
            onClick={() => updateSort('popular')}
          >
            인기순
          </button>
        </div>
      </div>
      {activeTag ? (
        <section className="panel tag-filter-card">
          <b>{formatTagLabel(activeTag)}</b>
          <span>태그가 포함된 기록만 보고 있습니다.</span>
          <Link to="/feed">필터 해제</Link>
        </section>
      ) : null}
      <div className="post-list">
        <PostListState
          loading={postsLoading}
          error={postsError}
          empty={!visiblePosts.length}
          onRetry={onRetryPosts}
        />
        {!postsLoading && !postsError
          ? visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={onToggleLike}
              likePending={Boolean(likePendingByPostId[post.id])}
              currentUserId={currentUserId}
              onDeletePost={onDeletePost}
              postActionPending={Boolean(postActionPendingByPostId[post.id])}
            />
          ))
          : null}
      </div>
    </main>
  );
}
