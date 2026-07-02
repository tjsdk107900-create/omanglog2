import Mascot from './Mascot.jsx';

export function WeeklySummary({ posts }) {
  const average = posts.length
    ? Math.round(posts.reduce((sum, post) => sum + post.level, 0) / posts.length)
    : 0;

  return (
    <section className="panel weekly-card">
      <h3>이번 주 기록 요약</h3>
      <p>최근 기록 기준 더미 요약</p>
      <div className="weekly-box">
        <div>
          <strong>이번 주 기록</strong>
          <p><b>{posts.length}</b> 개</p>
        </div>
        <div className="speech">평균 오망<br />{average}점</div>
        <Mascot mood="tired" />
      </div>
    </section>
  );
}

export function TagTopFive({ posts }) {
  const counts = posts
    .flatMap((post) => post.tags)
    .reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }), {});
  const topTags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section className="panel donut-card">
      <h3>태그별 TOP 5</h3>
      <div className="donut-wrap">
        <div className="donut"><span>TOP<br />5</span></div>
        <ul>
          {topTags.map(([tag, count], index) => (
            <li key={tag}>
              <i className={`c${index + 1}`} />
              {tag} <b>{count}</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
