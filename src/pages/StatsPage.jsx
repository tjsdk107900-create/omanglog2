import PostListState from '../components/PostListState.jsx';
import { TagTopFive, WeeklySummary } from '../components/SummaryCards.jsx';

function getWeekStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start.getTime();
}

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

export default function StatsPage({ posts, postsLoading, postsError, onRetryPosts }) {
  const weekStartMs = getWeekStart();
  const monthStartMs = getMonthStart();
  const weeklyCount = posts.filter((post) => Number(post.createdAtMs ?? 0) >= weekStartMs).length;
  const monthlyCount = posts.filter((post) => Number(post.createdAtMs ?? 0) >= monthStartMs).length;
  const levelCounts = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: posts.filter((post) => post.level === level).length,
  }));
  const maxLevelCount = Math.max(0, ...levelCounts.map((item) => item.count));

  return (
    <main className="page-shell stats-page-grid">
      <PostListState
        loading={postsLoading}
        error={postsError}
        empty={false}
        onRetry={onRetryPosts}
      />
      {!postsLoading && !postsError ? (
        <>
          <WeeklySummary posts={posts} />
          <TagTopFive posts={posts} />
          <section className="panel stat-detail-card">
            <h3>오망 지수 통계</h3>
            <div className="level-bars">
              {levelCounts.map(({ level, count }) => (
                <div key={level}>
                  <span>{level}단계</span>
                  <b style={{ width: maxLevelCount ? `${(count / maxLevelCount) * 100}%` : '0%' }} />
                  <em>{count}</em>
                </div>
              ))}
            </div>
          </section>
          <section className="panel stat-detail-card">
            <h3>주간 / 월간 요약</h3>
            <div className="summary-split">
              <div><strong>주간</strong><b>{weeklyCount}</b><span>개 기록</span></div>
              <div><strong>월간</strong><b>{monthlyCount}</b><span>개 기록</span></div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
