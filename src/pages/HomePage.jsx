import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Mascot from '../components/Mascot.jsx';
import PostCard from '../components/PostCard.jsx';
import PostListState from '../components/PostListState.jsx';
import { TagTopFive, WeeklySummary } from '../components/SummaryCards.jsx';

export default function HomePage({
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
  return (
    <main className="dashboard home-dashboard">
      <section className="feed-column">
        <section className="hero panel">
          <div className="browser-art">
            <div className="browser-bar">
              <span /><span /><span /><b />
            </div>
            <div className="browser-body">
              <div className="monitor" />
              <Sparkles className="burst" size={40} />
              <Mascot mood="dizzy" />
            </div>
          </div>
          <div className="hero-copy">
            <h2>괜찮아, 오늘도 조금 망했을 뿐</h2>
            <p>오망로그에 기록하면 내일은 웃으면서 볼 수 있어요.</p>
            <div className="dots"><span className="active" /><span /><span /><span /></div>
          </div>
        </section>

        <section className="panel prompt-card">
          <div>
            <p className="eyebrow">TODAY</p>
            <h2>오늘 뭐가 망했나요?</h2>
            <p>짧게 한 줄만 남겨도 통계와 오망카드로 쌓입니다.</p>
          </div>
          <Link className="primary-link" to="/write">기록하기</Link>
        </section>

        <section>
          <div className="page-section-head">
            <h2>최근 피드</h2>
            <Link to="/feed">전체 보기</Link>
          </div>
          <div className="post-list">
            <PostListState
              loading={postsLoading}
              error={postsError}
              empty={!posts.length}
              onRetry={onRetryPosts}
            />
            {!postsLoading && !postsError
              ? posts.slice(0, 2).map((post) => (
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
      </section>

      <aside className="stats-column">
        <WeeklySummary posts={posts} />
        <TagTopFive posts={posts} />
      </aside>
    </main>
  );
}
