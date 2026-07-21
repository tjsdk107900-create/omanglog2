import { Link } from 'react-router-dom';
import Mascot from './Mascot.jsx';
import { formatTagLabel, getTagRoute } from '../lib/tags.js';

function getWeekStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start.getTime();
}

export function WeeklySummary({ posts }) {
  const weekStartMs = getWeekStart();
  const weeklyPosts = posts.filter((post) => Number(post.createdAtMs ?? 0) >= weekStartMs);
  const average = weeklyPosts.length
    ? Math.round(weeklyPosts.reduce((sum, post) => sum + post.level, 0) / weeklyPosts.length)
    : 0;

  return (
    <section className="panel weekly-card">
      <h3>이번 주 기록 요약</h3>
      <p>최근 기록 기준으로 오망 지수를 요약합니다.</p>
      <div className="weekly-box">
        <div>
          <strong>이번 주 기록</strong>
          <p><b>{weeklyPosts.length}</b> 개</p>
        </div>
        <div className="speech">평균 오망<br />{average}단계</div>
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
          {topTags.length ? topTags.map(([tag, count], index) => (
            <li key={tag}>
              <i className={`c${index + 1}`} />
              <Link to={getTagRoute(tag)}>{formatTagLabel(tag)}</Link> <b>{count}</b>
            </li>
          )) : <li>아직 태그가 없습니다.</li>}
        </ul>
      </div>
    </section>
  );
}
