import { TagTopFive, WeeklySummary } from '../components/SummaryCards.jsx';

export default function StatsPage({ posts }) {
  const levelCounts = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: posts.filter((post) => post.level === level).length,
  }));

  return (
    <main className="page-shell stats-page-grid">
      <WeeklySummary posts={posts} />
      <TagTopFive posts={posts} />
      <section className="panel stat-detail-card">
        <h3>오망 지수 통계</h3>
        <div className="level-bars">
          {levelCounts.map(({ level, count }) => (
            <div key={level}>
              <span>{level}점</span>
              <b style={{ width: `${Math.max(12, count * 22)}%` }} />
              <em>{count}</em>
            </div>
          ))}
        </div>
      </section>
      <section className="panel stat-detail-card">
        <h3>주간 / 월간 요약</h3>
        <div className="summary-split">
          <div><strong>주간</strong><b>{posts.length}</b><span>개 기록</span></div>
          <div><strong>월간</strong><b>{posts.length * 4}</b><span>개 예상</span></div>
        </div>
      </section>
    </main>
  );
}
