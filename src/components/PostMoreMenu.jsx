import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

export default function PostMoreMenu({
  post,
  currentUserId,
  onDelete,
  disabled = false,
  redirectAfterDelete = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuId = useId();
  const buttonRef = useRef(null);
  const firstItemRef = useRef(null);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const canManage = Boolean(currentUserId && post?.authorId && post.authorId === currentUserId);

  useEffect(() => {
    if (!open) return undefined;

    const focusTimer = window.setTimeout(() => firstItemRef.current?.focus(), 0);

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleOtherMenuOpen = (event) => {
      if (event.detail !== post.id) setOpen(false);
    };

    const handleScroll = () => {
      setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('post-menu-open', handleOtherMenuOpen);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('post-menu-open', handleOtherMenuOpen);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, post.id]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, currentUserId, post.id]);

  useEffect(() => {
    if (!canManage) setOpen(false);
  }, [canManage]);

  if (!canManage) return null;

  const toggleMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        window.dispatchEvent(new CustomEvent('post-menu-open', { detail: post.id }));
      }
      return nextOpen;
    });
  };

  const handleEdit = () => {
    setOpen(false);
    navigate(`/post/${post.id}/edit`);
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete?.(post.id, redirectAfterDelete);
  };

  return (
    <div className="post-more" ref={rootRef}>
      <button
        ref={buttonRef}
        className="icon-only"
        type="button"
        aria-label="게시글 메뉴 열기"
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        disabled={disabled}
        onClick={toggleMenu}
      >
        <MoreHorizontal size={20} />
      </button>
      {open ? (
        <div id={menuId} className="post-menu" role="menu">
          <button ref={firstItemRef} type="button" role="menuitem" onClick={handleEdit}>
            수정
          </button>
          <button type="button" role="menuitem" disabled={disabled} onClick={handleDelete}>
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
