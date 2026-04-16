import { supabase, SupabaseEventInsert } from './supabase';
import {
  LocalEvent,
  getLocalEvents,
  saveLocalEvent,
  saveLocalEventWithId,
  updateLocalEvent,
  deleteLocalEvent,
  setLocalEvents,
} from './localStorage';

/**
 * Create an event.
 *
 * - Logged-in users: insert text fields into Supabase first (to get
 *   the UUID), then save the full event (including photo URIs) to
 *   AsyncStorage with that same UUID.
 * - Guests: save to AsyncStorage only with a local ID.
 */
export async function createEvent(
  eventData: Omit<LocalEvent, 'id' | 'created_at'>,
  userId?: string,
): Promise<LocalEvent> {
  if (!userId) {
    return saveLocalEvent(eventData);
  }

  // Build the Supabase row — text fields only, no photos.
  const row: SupabaseEventInsert = {
    user_id: userId,
    title: eventData.title,
    type: eventData.type,
    sport: eventData.sport || null,
    venue: eventData.venue,
    venue_location: eventData.venue_location || null,
    date: eventData.date,
    latitude: eventData.latitude || null,
    longitude: eventData.longitude || null,
    home_team: eventData.home_team || null,
    away_team: eventData.away_team || null,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select('id, created_at')
    .single();

  if (error) throw error;

  // Save locally with the Supabase UUID so both stores share one ID.
  const localEvent: LocalEvent = {
    ...eventData,
    id: data.id,
    created_at: data.created_at,
  };
  await saveLocalEventWithId(localEvent);
  return localEvent;
}

/**
 * Fetch events.
 *
 * Always reads from AsyncStorage first (it has photos).  If the user
 * is logged in AND AsyncStorage is empty, pull from Supabase (new-
 * device scenario) and seed AsyncStorage with the cloud events
 * (without photos).
 */
export async function fetchEvents(userId?: string): Promise<LocalEvent[]> {
  const local = await getLocalEvents();

  if (local.length > 0 || !userId) {
    return local;
  }

  // New device — pull cloud events and cache locally.
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error || !data || data.length === 0) {
    return [];
  }

  const events: LocalEvent[] = data.map((row: any) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    sport: row.sport ?? undefined,
    venue: row.venue,
    venue_location: row.venue_location ?? undefined,
    date: row.date,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    home_team: row.home_team ?? undefined,
    away_team: row.away_team ?? undefined,
    created_at: row.created_at,
    // photos / cover_photo stay undefined — they only exist on the
    // device where the event was originally created.
  }));

  await setLocalEvents(events);
  return events;
}

/**
 * Delete an event.
 *
 * Removes from AsyncStorage always, and from Supabase if logged in.
 */
export async function removeEvent(
  eventId: string,
  userId?: string,
): Promise<void> {
  await deleteLocalEvent(eventId);

  if (userId) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) {
      // Non-fatal — local delete already succeeded. The cloud row
      // will be orphaned but won't break anything.
      console.warn('[eventService] Supabase delete failed:', error.message);
    }
  }
}

/**
 * Update an event.
 *
 * Updates AsyncStorage always, and syncs text changes to Supabase if
 * logged in.
 */
export async function editEvent(
  eventId: string,
  updates: Partial<LocalEvent>,
  userId?: string,
): Promise<void> {
  await updateLocalEvent(eventId, updates);

  if (userId) {
    // Strip local-only fields before sending to Supabase.
    const { photos, cover_photo, ...cloudUpdates } = updates as any;

    if (Object.keys(cloudUpdates).length > 0) {
      const { error } = await supabase
        .from('events')
        .update(cloudUpdates)
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[eventService] Supabase update failed:', error.message);
      }
    }
  }
}

/**
 * Migrate guest events to a newly-authenticated account.
 *
 * Only events with `local_*` IDs are migrated — events already backed
 * by a Supabase UUID are left alone, so this is safe to call on every
 * sign-in (no-ops when there's nothing to migrate).
 *
 * Inserts the guest events into Supabase (text only), then swaps their
 * local IDs to the returned UUIDs while keeping photos and list order
 * intact.  Already-synced events stay untouched.
 */
export async function migrateGuestEvents(userId: string): Promise<number> {
  const localEvents = await getLocalEvents();
  const guestEvents = localEvents.filter(e => e.id.startsWith('local_'));
  if (guestEvents.length === 0) return 0;

  const rows: SupabaseEventInsert[] = guestEvents.map(e => ({
    user_id: userId,
    title: e.title,
    type: e.type,
    sport: e.sport || null,
    venue: e.venue,
    venue_location: e.venue_location || null,
    date: e.date,
    latitude: e.latitude || null,
    longitude: e.longitude || null,
    home_team: e.home_team || null,
    away_team: e.away_team || null,
  }));

  const { data, error } = await supabase
    .from('events')
    .insert(rows)
    .select('id');

  if (error) throw error;
  if (!data || data.length !== guestEvents.length) return 0;

  // Map each old local_* ID to its new Supabase UUID.
  const idMap = new Map<string, string>();
  guestEvents.forEach((e, i) => idMap.set(e.id, data[i].id));

  // Swap IDs in-place so order is preserved and non-guest events are
  // left untouched.
  const updated = localEvents.map(e => {
    const newId = idMap.get(e.id);
    return newId ? { ...e, id: newId } : e;
  });
  await setLocalEvents(updated);

  return guestEvents.length;
}
