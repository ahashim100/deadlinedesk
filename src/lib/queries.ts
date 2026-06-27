// Shared read queries. RLS scopes every result to the current user.
import { createClient } from '@/lib/supabase/server';
import type {
  Deadline,
  Property,
  Unit,
  Lease,
  ReminderChannel,
  DeadlineType,
} from '@/lib/database.types';

/** A deadline joined up to its lease, unit and property for display. */
export interface DeadlineWithContext extends Deadline {
  lease: {
    id: string;
    tenant_name: string | null;
    unit: {
      unit_label: string;
      property: { id: string; nickname: string };
    };
  };
}

/** All upcoming deadlines for the current user, soonest first. */
export async function getUpcomingDeadlines(): Promise<DeadlineWithContext[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('deadlines')
    .select(
      `id, lease_id, type, due_date, status, source, created_at,
       lease:leases!inner(
         id, tenant_name,
         unit:units!inner(
           unit_label,
           property:properties!inner(id, nickname)
         )
       )`,
    )
    .eq('status', 'upcoming')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as DeadlineWithContext[];
}

export interface LeaseWithDeadlines extends Lease {
  deadlines: { status: string; due_date: string }[];
}
export interface PropertyWithUnits extends Property {
  units: (Unit & { leases: LeaseWithDeadlines[] })[];
}

/** All properties for the current user with their units, leases and deadlines. */
export async function getPropertiesWithUnits(): Promise<PropertyWithUnits[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select(`*, units(*, leases(*, deadlines(status, due_date)))`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as PropertyWithUnits[];
}

export interface ReminderLogEntry {
  id: string;
  channel: ReminderChannel;
  lead_time: number;
  sent_at: string;
  status: string;
  deadline: {
    type: DeadlineType;
    due_date: string;
    lease: {
      tenant_name: string | null;
      unit: { unit_label: string; property: { nickname: string } };
    };
  };
}

/** The current user's recent reminder sends, newest first. */
export async function getReminderLog(limit = 100): Promise<ReminderLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reminder_log')
    .select(
      `id, channel, lead_time, sent_at, status,
       deadline:deadlines!inner(
         type, due_date,
         lease:leases!inner(
           tenant_name,
           unit:units!inner(
             unit_label,
             property:properties!inner(nickname)
           )
         )
       )`,
    )
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ReminderLogEntry[];
}

/** Summarise a property's upcoming deadlines: count + soonest due date. */
export function summariseDeadlines(property: PropertyWithUnits): {
  upcoming: number;
  soonest: string | null;
} {
  const upcomingDates = property.units
    .flatMap((u) => u.leases)
    .flatMap((l) => l.deadlines ?? [])
    .filter((d) => d.status === 'upcoming')
    .map((d) => d.due_date)
    .sort();
  return { upcoming: upcomingDates.length, soonest: upcomingDates[0] ?? null };
}
