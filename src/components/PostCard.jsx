import { Link } from 'react-router-dom';
import { MessageCircle, Share2 } from 'lucide-react';
import Mascot from './Mascot.jsx';
import PostMoreMenu from './PostMoreMenu.jsx';
import { formatTagLabel, getTagRoute } from '../lib/tags.js';

export default function PostCard({
  post,
  compact = false,
  onToggleLike,
  likePending = false,
  currentUserId,
  onDeletePost,
  postActionPending = false,
}) {
  const handleLikeClick = () => {
    onToggleLike?.(post.id);
  };

  return (
    <article className="post panel">
      <div className="post-body">
        <Link className="author-avatar-link" to={`/users/${post.authorId}`}>
          {post.authorAvatar ? (
            <img className="profile-avatar post-author-avatar" src={post.authorAvatar} alt="" />
          ) : (
            <Mascot mood="mini" />
          )}
        </Link>
        <div className="post-copy">
          <div className="post-meta">
            <Link className="author-link" to={`/users/${post.authorId}`}>{post.author}</Link>
            <span>{post.time}</span>
          </div>
          <h3>
            <Link to={`/post/${post.id}`}>{post.title}</Link>
          </h3>
          {!compact && <p>{post.body}</p>}
          <div className="tags">
            {post.tags.slice(0, 5).map((tag) => (
              <Link key={tag} to={getTagRoute(tag)} onClick={(event) => event.stopPropagation()}>
                {formatTagLabel(tag)}
              </Link>
            ))}
            {post.tags.length > 5 ? <span>+{post.tags.length - 5}</span> : null}
          </div>
          {post.likeError ? <p className="post-inline-error">{post.likeError}</p> : null}
          {post.commentError ? <p className="post-inline-error">{post.commentError}</p> : null}
          {post.actionError ? <p className="post-inline-error">{post.actionError}</p> : null}
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
        <button
          className={`laugh${post.likedByMe ? ' is-liked' : ''}`}
          type="button"
          aria-pressed={post.likedByMe}
          disabled={likePending}
          onClick={handleLikeClick}
        >
          공감 {post.empathy}
        </button>
        <button type="button">오망 {post.level}</button>
        <Link className="ghost" to={`/post/${post.id}`}>
          <MessageCircle size={17} /> 댓글 {post.comments}
        </Link>
        <span />
        <button className="icon-only" type="button" aria-label="공유">
          <Share2 size={18} />
        </button>
        <PostMoreMenu
          post={post}
          currentUserId={currentUserId}
          onDelete={onDeletePost}
          disabled={postActionPending}
        />
      </div>
    </article>
  );
}
