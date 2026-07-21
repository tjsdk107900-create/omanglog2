import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Mascot from '../components/Mascot.jsx';
import PostListState from '../components/PostListState.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  createComment,
  deleteComment,
  fetchComments,
  updateComment,
} from '../lib/posts.js';
import { formatTagLabel, getTagRoute } from '../lib/tags.js';

function getFriendlyError(error, fallback) {
  return error?.message || fallback;
}

export default function PostDetailPage({
  posts,
  postsLoading,
  postsError,
  onRetryPosts,
  onToggleLike,
  likePendingByPostId,
  onCommentCountChange,
  currentUserId,
  onDeletePost,
  postActionPendingByPostId,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const post = posts.find((item) => item.id === id);
  const canManagePost = Boolean(currentUserId && post?.authorId === currentUserId);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [pendingCommentId, setPendingCommentId] = useState('');

  const loadComments = async () => {
    if (!id) return;

    setCommentsLoading(true);
    setCommentsError('');

    try {
      const nextComments = await fetchComments(id);
      setComments(nextComments);
    } catch (error) {
      console.error('[Supabase] comments load failed', error);
      setComments([]);
      setCommentsError(getFriendlyError(error, '댓글을 불러오지 못했습니다.'));
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [id]);

  const handleCreateComment = async (event) => {
    event.preventDefault();
    const content = commentInput.trim();

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!content || submittingComment) return;

    setSubmittingComment(true);
    setCommentMessage('');

    const optimisticComment = {
      id: `pending-${Date.now()}`,
      postId: id,
      userId: user.id,
      author: profile?.nickname ?? user.email ?? '오망로그 사용자',
      authorAvatar: profile?.profile_image ?? null,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      time: '방금',
      edited: false,
    };

    setComments((current) => [...current, optimisticComment]);
    setCommentInput('');
    onCommentCountChange?.(id, 1);

    try {
      const savedComment = await createComment({ postId: id, userId: user.id, content });
      setComments((current) => current.map((comment) => (
        comment.id === optimisticComment.id
          ? {
            ...optimisticComment,
            id: String(savedComment.id),
            createdAt: savedComment.created_at,
            updatedAt: savedComment.updated_at,
          }
          : comment
      )));
    } catch (error) {
      console.error('[Supabase] comment create failed', error);
      setComments((current) => current.filter((comment) => comment.id !== optimisticComment.id));
      setCommentInput(content);
      onCommentCountChange?.(id, -1);
      setCommentMessage(getFriendlyError(error, '댓글 등록 중 오류가 발생했습니다.'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const startEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setCommentMessage('');
  };

  const cancelEdit = () => {
    setEditingCommentId('');
    setEditingContent('');
  };

  const handleUpdateComment = async (comment) => {
    const content = editingContent.trim();
    if (!user || pendingCommentId || !content) return;

    const previousContent = comment.content;
    setPendingCommentId(comment.id);
    setCommentMessage('');
    setComments((current) => current.map((item) => (
      item.id === comment.id
        ? { ...item, content, updatedAt: new Date().toISOString(), edited: true }
        : item
    )));
    cancelEdit();

    try {
      const savedComment = await updateComment({
        commentId: comment.id,
        userId: user.id,
        content,
      });
      setComments((current) => current.map((item) => (
        item.id === comment.id
          ? {
            ...item,
            content: savedComment.content,
            updatedAt: savedComment.updated_at,
            edited: true,
          }
          : item
      )));
    } catch (error) {
      console.error('[Supabase] comment update failed', error);
      setComments((current) => current.map((item) => (
        item.id === comment.id ? { ...item, content: previousContent } : item
      )));
      setCommentMessage(getFriendlyError(error, '댓글 수정 중 오류가 발생했습니다.'));
    } finally {
      setPendingCommentId('');
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!user || pendingCommentId) return;
    if (!window.confirm('댓글을 삭제할까요?')) return;

    setPendingCommentId(comment.id);
    setCommentMessage('');
    setComments((current) => current.filter((item) => item.id !== comment.id));
    onCommentCountChange?.(id, -1);

    try {
      await deleteComment({ commentId: comment.id, userId: user.id });
    } catch (error) {
      console.error('[Supabase] comment delete failed', error);
      setComments((current) => [...current, comment].sort((a, b) => (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )));
      onCommentCountChange?.(id, 1);
      setCommentMessage(getFriendlyError(error, '댓글 삭제 중 오류가 발생했습니다.'));
    } finally {
      setPendingCommentId('');
    }
  };

  if (postsLoading || postsError) {
    return (
      <main className="page-shell">
        <PostListState
          loading={postsLoading}
          error={postsError}
          empty={false}
          onRetry={onRetryPosts}
        />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="page-shell">
        <section className="panel empty-card">
          <h2>게시글을 찾을 수 없습니다.</h2>
          <Link to="/feed">피드로 돌아가기</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page">
      <article className="panel detail-card">
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
            <h1>{post.title}</h1>
            <p>{post.body}</p>
            <div className="tags">
              {post.tags.map((tag) => (
                <Link key={tag} to={getTagRoute(tag)}>
                  {formatTagLabel(tag)}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="detail-actions">
          <button
            className={`laugh${post.likedByMe ? ' is-liked' : ''}`}
            type="button"
            aria-pressed={post.likedByMe}
            disabled={Boolean(likePendingByPostId[post.id])}
            onClick={() => onToggleLike?.(post.id)}
          >
            공감 {post.empathy}
          </button>
          <Link to="/omang-card">오망카드 보기</Link>
          {canManagePost ? (
            <>
              <Link to={`/post/${post.id}/edit`}>수정</Link>
              <button
                type="button"
                disabled={Boolean(postActionPendingByPostId[post.id])}
                onClick={() => onDeletePost?.(post.id, true)}
              >
                삭제
              </button>
            </>
          ) : null}
        </div>
        {post.likeError ? <p className="post-inline-error">{post.likeError}</p> : null}
        {post.actionError ? <p className="post-inline-error">{post.actionError}</p> : null}
      </article>

      <section className="panel comments-card">
        <h2><MessageCircle size={20} /> 댓글 {post.comments}</h2>

        {commentsLoading ? <p className="comments-state">댓글을 불러오는 중입니다.</p> : null}
        {commentsError ? (
          <div className="comments-state">
            <p>{commentsError}</p>
            <button type="button" onClick={loadComments}>다시 시도</button>
          </div>
        ) : null}
        {!commentsLoading && !commentsError && !comments.length ? (
          <p className="comments-state">아직 댓글이 없습니다.</p>
        ) : null}

        {!commentsError && comments.length ? (
          <ul className="comment-list">
            {comments.map((comment) => {
              const isMine = comment.userId === user?.id;
              const isEditing = editingCommentId === comment.id;
              const isPending = pendingCommentId === comment.id;

              return (
                <li key={comment.id} className="comment-item">
                  <Link className="author-avatar-link" to={`/users/${comment.userId}`}>
                    {comment.authorAvatar ? (
                      <img className="profile-avatar comment-avatar" src={comment.authorAvatar} alt="" />
                    ) : (
                      <Mascot mood="mini" />
                    )}
                  </Link>
                  <div className="comment-copy">
                    <div className="comment-meta">
                      <Link className="author-link" to={`/users/${comment.userId}`}>{comment.author}</Link>
                      <span>{comment.time}{comment.edited ? ' · 수정됨' : ''}</span>
                    </div>
                    {isEditing ? (
                      <div className="comment-edit">
                        <textarea
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          rows={3}
                          maxLength={300}
                        />
                        <div>
                          <button
                            type="button"
                            disabled={!editingContent.trim() || isPending}
                            onClick={() => handleUpdateComment(comment)}
                          >
                            저장
                          </button>
                          <button type="button" disabled={isPending} onClick={cancelEdit}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <p>{comment.content}</p>
                    )}
                  </div>
                  {isMine && !isEditing ? (
                    <div className="comment-actions">
                      <button type="button" disabled={isPending} onClick={() => startEdit(comment)}>수정</button>
                      <button type="button" disabled={isPending} onClick={() => handleDeleteComment(comment)}>삭제</button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {commentMessage ? <p className="auth-message">{commentMessage}</p> : null}

        <form onSubmit={handleCreateComment}>
          <input
            value={commentInput}
            onChange={(event) => setCommentInput(event.target.value)}
            placeholder="댓글을 입력하세요."
            maxLength={300}
          />
          <button type="submit" disabled={!commentInput.trim() || submittingComment}>
            {submittingComment ? '등록 중...' : '등록'}
          </button>
        </form>
      </section>
    </main>
  );
}
