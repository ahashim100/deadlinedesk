'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import type { Deadline, DeadlineStatus, DeadlineType } from '@/lib/database.types';

const VALID_STATUSES: DeadlineStatus[] = ['upcoming', 'done', 'dismissed'];
const VALID_TYPES: DeadlineType[] = [
  'lease_renewal',
  'rent_increase_notice',
  'deposit_return',
  'inspection',
  'insurance_renewal',
  'license_renewal',
];

/** Mark a deadline done / dismissed / back to upcoming. */
export async function setDeadlineStatus(
  deadlineId: string,
  status: DeadlineStatus,
  leaseId: string,
): Promise<void> {
  await requireUser();
  if (!VALID_STATUSES.includes(status)) return;
  const supabase = await createClient();

  // Stamp/clear the completion record alongside the status change.
  const patch: Partial<Deadline> = { status };
  if (status === 'done') {
    patch.completed_at = new Date().toISOString();
  } else if (status === 'upcoming') {
    patch.completed_at = null;
    patch.completion_note = null;
  }

  await supabase.from('deadlines').update(patch).eq('id', deadlineId);
  revalidatePath(`/leases/${leaseId}`);
  revalidatePath('/dashboard');
}

/** Mark done with a note for the record (the "proof" trail). */
export async function completeWithNote(
  deadlineId: string,
  leaseId: string,
  note: string | null,
): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const trimmed = note?.trim() || null;

  await supabase
    .from('deadlines')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      completion_note: trimmed,
    })
    .eq('id', deadlineId);

  revalidatePath(`/leases/${leaseId}`);
  revalidatePath('/dashboard');
}

/** Snooze/reschedule a deadline to a new due date (preserves through re-sync). */
export async function snoozeDeadline(
  deadlineId: string,
  leaseId: string,
  newDueDate: string,
): Promise<void> {
  await requireUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) return;
  const supabase = await createClient();
  await supabase
    .from('deadlines')
    .update({
      due_date: newDueDate,
      due_date_overridden: true,
      status: 'upcoming',
    })
    .eq('id', deadlineId);
  revalidatePath(`/leases/${leaseId}`);
  revalidatePath('/dashboard');
}

const manualSchema = z.object({
  type: z.enum(VALID_TYPES as [DeadlineType, ...DeadlineType[]]),
  due_date: z.string().min(1, 'Pick a date.'),
});

export interface DeadlineActionResult {
  error?: string;
}

/** Add a one-off manual deadline to a lease. */
export async function addManualDeadline(
  leaseId: string,
  _prev: DeadlineActionResult,
  formData: FormData,
): Promise<DeadlineActionResult> {
  await requireUser();
  const supabase = await createClient();

  const parsed = manualSchema.safeParse({
    type: formData.get('type'),
    due_date: formData.get('due_date'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const { error } = await supabase.from('deadlines').insert({
    lease_id: leaseId,
    type: parsed.data.type,
    due_date: parsed.data.due_date,
    status: 'upcoming',
    source: 'manual',
  });
  if (error) return { error: error.message };

  revalidatePath(`/leases/${leaseId}`);
  revalidatePath('/dashboard');
  return {};
}

/** Delete a manual deadline. */
export async function deleteDeadline(
  deadlineId: string,
  leaseId: string,
): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from('deadlines').delete().eq('id', deadlineId);
  revalidatePath(`/leases/${leaseId}`);
  revalidatePath('/dashboard');
}
