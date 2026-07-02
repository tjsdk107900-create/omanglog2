import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import Mascot from './Mascot.jsx';

export default function PostCard({ post, compact = false }) {
  return (
    <article className="post panel">
      <div className="post-body">
        <Mascot mood="mini" />
        <div className="post-copy">
          <div className="post-meta">
            <b>{post.author}</b>
            <span>{post.time}</span>
          </div>
          <h3>
            <Link to={`/post/${post.id}`}>{post.title}</Link>
          </h3>
          {!compact && <p>{post.body}</p>}
          <div className="tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
      </div>
      <div className="sketch-card">
        <p>{post.cardText}</p>
        <div className="laptop">
          <Mascot mood="worried" />
          <span className="screen">!</span>
        </div>
        <Link to="/omang-card">오망카드 보기</Link>
      </div>
      <div className="post-actions">
        <button className="laugh" type="button">공감 {post.empathy}</button>
        <button type="button">오망 {post.level}</button>
        <Link className="ghost" to={`/post/${post.id}`}>
          <MessageCircle size={17} /> 댓글 {post.comments}
        </Link>
        <span />
        <button className="icon-only" type="button" aria-label="공유">
          <Share2 size={18} />
        </button>
        <button className="icon-only" type="button" aria-label="더 보기">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </article>
  );
}
