import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTagLabel, getTagRoute } from '../lib/tags.js';

export default function RankingPanel({ posts, mode = 'tag' }) {
  const items = mode === 'empathy'
    ? posts
        .map((post) => [post.title, post.empathy])
        .sort((a, b) => b[1] - a[1])
    : Object.entries(posts.flatMap((post) => post.tags).reduce(
        (acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }),
        {},
      )).sort((a, b) => b[1] - a[1]);

  return (
    <section className="panel ranking-card">
      <div className="section-head">
        <h3><Crown size={22} /> {mode === 'empathy' ? '공감 랭킹' : '태그 랭킹'}</h3>
      </div>
      <ol>
        {items.slice(0, 5).map(([label, count], index) => (
          <li key={label}>
            <span>{index + 1}</span>
            <b>
              {mode === 'tag' ? <Link to={getTagRoute(label)}>{formatTagLabel(label)}</Link> : label}
            </b>
            <em>{count}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}
