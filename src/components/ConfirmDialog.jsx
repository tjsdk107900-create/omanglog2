import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '삭제',
  cancelLabel = '취소',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const focusTimer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancel?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="retro-dialog-layer" role="presentation">
      <div className="retro-dialog confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="retro-title">
          <span id="confirm-dialog-title">{title}</span>
          <button type="button" disabled={loading} aria-label="닫기" onClick={onCancel}>×</button>
        </div>
        <section>
          <p>{description}</p>
          {error ? <p className="post-inline-error">{error}</p> : null}
          <div className="confirm-actions">
            <button ref={cancelRef} className="confirm-cancel" type="button" disabled={loading} onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="confirm-danger" type="button" disabled={loading} onClick={onConfirm}>
              {loading ? '삭제 중...' : confirmLabel}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
