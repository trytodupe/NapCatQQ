import { WebsocketClientConfig } from '@/napcat-onebot/config/config';
import { OB11EmitEventContent } from '@/napcat-onebot/network/index';

function normalizeIdList (ids: string[] | undefined): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids
    .map(id => String(id).trim())
    .filter(Boolean);
}

export function shouldForwardEvent (
  config: Pick<WebsocketClientConfig, 'eventFilter'>,
  event: OB11EmitEventContent
): boolean {
  if ((event as any)?.message_type !== 'group') {
    return true;
  }

  const groupId = String((event as any)?.group_id ?? '').trim();
  if (!groupId) {
    return true;
  }

  const groupBlacklist = normalizeIdList(config.eventFilter?.groupBlacklist);
  if (groupBlacklist.includes(groupId)) {
    return false;
  }

  const groupWhitelist = normalizeIdList(config.eventFilter?.groupWhitelist);
  if (groupWhitelist.length === 0) {
    return true;
  }

  return groupWhitelist.includes(groupId);
}
