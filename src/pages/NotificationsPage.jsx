import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  fetchNotifications,
  getNotificationMessage,
  getNotificationTarget,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../lib/notifications.js';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = useCallback(async ({ append = false } = {}) => {
    if (!user?.id) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const nextItems = await fetchNotifications({
        userId: user.id,
        limit: PAGE_SIZE,
        offset: append ? notifications.length : 0,
      });
      setNotifications((current) => (append ? [...current, ...nextItems] : nextItems));
      setHasMore(nextItems.length === PAGE_SIZE);
    } catch (loadError) {
      console.error('[Supabase] notifications load failed', loadError);
      setError(loadError.message || '알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [notifications.length, user?.id]);

  useEffect(() => {
    setNotifications([]);
    setHasMore(false);
    setMessage('');
    if (user?.id) loadNotifications();
  }, [loadNotifications, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const channel = subscribeToNotifications(user.id, () => {
      loadNotifications();
    });

    return () => {
      unsubscribeFromNotifications(channel).catch((unsubscribeError) => {
        console.warn('[Supabase] notifications unsubscribe failed', unsubscribeError);
      });
    };
  }, [loadNotifications, user?.id]);

  const handleNotificationClick = async (notification) => {
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, isRead: true } : item
    )));
    window.dispatchEvent(new Event('notifications:changed'));

    markNotificationRead({ notificationId: notification.id, userId: user.id }).catch((readError) => {
      console.warn('[Supabase] notification read failed', readError);
      window.dispatchEvent(new Event('notifications:changed'));
    });

    navigate(getNotificationTarget(notification));
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;

    setMessage('');
    const previous = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    window.dispatchEvent(new Event('notifications:changed'));

    try {
      await markAllNotificationsRead(user.id);
    } catch (markError) {
      console.error('[Supabase] notifications mark all failed', markError);
      setNotifications(previous);
      setMessage(markError.message || '알림 읽음 처리 중 오류가 발생했습니다.');
      window.dispatchEvent(new Event('notifications:changed'));
    }
  };

  return (
    <main className="page-shell notifications-page">
      <section className="panel notifications-card">
        <div className="page-section-head">
          <h2>알림</h2>
          <button type="button" disabled={!notifications.some((item) => !item.isRead)} onClick={handleMarkAllRead}>
            모두 읽음
          </button>
        </div>

        {loading ? <p className="comments-state">알림을 불러오는 중입니다.</p> : null}
        {error ? <p className="post-inline-error">{error}</p> : null}
        {message ? <p className="post-inline-error">{message}</p> : null}
        {!loading && !error && !notifications.length ? (
          <section className="empty-card">
            <h2>아직 알림이 없습니다.</h2>
          </section>
        ) : null}

        {!loading && !error && notifications.length ? (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  className={notification.isRead ? 'notification-item' : 'notification-item is-unread'}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.actorAvatar ? (
                    <img className="profile-avatar comment-avatar" src={notification.actorAvatar} alt="" />
                  ) : (
                    <Mascot mood="mini" />
                  )}
                  <span>
                    <b>{getNotificationMessage(notification)}</b>
                    {notification.postTitle ? <em>{notification.postTitle}</em> : null}
                    {notification.commentContent ? <small>{notification.commentContent}</small> : null}
                    <i>{notification.time}</i>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {hasMore ? (
          <button className="load-more-button" type="button" disabled={loadingMore} onClick={() => loadNotifications({ append: true })}>
            {loadingMore ? '불러오는 중...' : '더보기'}
          </button>
        ) : null}
      </section>
    </main>
  );
}
