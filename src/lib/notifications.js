import { supabase } from './supabase.js';

const NOTIFICATION_SETUP_ERROR = '알림 기능 DB 설정이 필요합니다.';
const MISSING_SCHEMA_CODES = ['PGRST106', 'PGRST200', 'PGRST205', '42P01'];

function isMissingSchemaError(error) {
  return MISSING_SCHEMA_CODES.includes(error?.code);
}

function getFriendlyNotificationError(error) {
  if (isMissingSchemaError(error)) return NOTIFICATION_SETUP_ERROR;
  return error?.message || '알림 처리 중 오류가 발생했습니다.';
}

function formatRelativeTime(value) {
  if (!value) return '';

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return '';

  const diffMs = Date.now() - createdAt.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;

  return createdAt.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function mapNotification(row) {
  const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
  const post = Array.isArray(row.post) ? row.post[0] : row.post;
  const comment = Array.isArray(row.comment) ? row.comment[0] : row.comment;

  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    actorName: actor?.nickname ?? '알 수 없는 사용자',
    actorAvatar: actor?.profile_image ?? null,
    type: row.type,
    postId: row.post_id,
    postTitle: post?.title ?? '',
    commentId: row.comment_id,
    commentContent: comment?.content ?? '',
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    time: formatRelativeTime(row.created_at),
  };
}

export function getNotificationMessage(notification) {
  if (notification.type === 'like') {
    return `${notification.actorName}님이 회원님의 게시글에 공감했습니다.`;
  }

  if (notification.type === 'comment') {
    return `${notification.actorName}님이 회원님의 게시글에 댓글을 남겼습니다.`;
  }

  if (notification.type === 'follow') {
    return `${notification.actorName}님이 회원님을 팔로우했습니다.`;
  }

  return '새 알림이 도착했습니다.';
}

export function getNotificationTarget(notification) {
  if (notification.type === 'follow' && notification.actorId) {
    return `/users/${notification.actorId}`;
  }

  if (notification.postId) {
    return `/post/${notification.postId}`;
  }

  return '/notifications';
}

export async function fetchNotifications({ userId, limit = 20, offset = 0 }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      recipient_id,
      actor_id,
      type,
      post_id,
      comment_id,
      follow_id,
      is_read,
      created_at,
      actor:profiles!notifications_actor_id_fkey(id, nickname, profile_image),
      post:posts(id, title),
      comment:comments(id, content)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(getFriendlyNotificationError(error));
  return (data ?? []).map(mapNotification);
}

export async function fetchUnreadNotificationCount(userId) {
  if (!supabase || !userId) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(getFriendlyNotificationError(error));
  return count ?? 0;
}

export async function markNotificationRead({ notificationId, userId }) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (!userId) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('recipient_id', userId);

  if (error) throw new Error(getFriendlyNotificationError(error));
}

export async function markAllNotificationsRead(userId) {
  if (!supabase || !userId) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(getFriendlyNotificationError(error));
}

export function subscribeToNotifications(userId, onChange) {
  if (!supabase || !userId) return null;

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onChange?.(payload);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase] notifications realtime channel error');
      }
    });

  return channel;
}

export async function unsubscribeFromNotifications(channel) {
  if (!supabase || !channel) return;
  await supabase.removeChannel(channel);
}
