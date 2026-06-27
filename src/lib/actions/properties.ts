'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { isStateSupported } from '@/lib/rules';
import { syncLeaseDeadlines } from '@/lib/actions/deadline-sync';

// --- Form parsing helpers --------------------------------------------------

const str = (v: FormDataEntryValue | null): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s === '' ? null : s;
};
const num = (v: FormDataEntryValue | null): number | null => {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const propertyLeaseSchema = z.object({
  nickname: z.string().min(1, 'Give the property a nickname.'),
  address: z.string().nullable(),
  state: z.string().min(2),
  unit_label: z.string().min(1, 'Unit label is required.'),
  tenant_name: z.string().nullable(),
  tenant_email: z.string().email().nullable().or(z.literal(null)),
  lease_start: z.string().nullable(),
  lease_end: z.string().nullable(),
  monthly_rent: z.number().nullable(),
  deposit_amount: z.number().nullable(),
  move_out_date: z.string().nullable(),
  rent_increase_notice_days: z.number().int().nullable(),
  license_renewal_date: z.string().nullable(),
  insurance_renewal_date: z.string().nullable(),
  inspection_date: z.string().nullable(),
});

export interface ActionResult {
  error?: string;
}

function parseForm(formData: FormData) {
  return propertyLeaseSchema.safeParse({
    nickname: str(formData.get('nickname')) ?? '',
    address: str(formData.get('address')),
    state: (str(formData.get('state')) ?? 'CA').toUpperCase(),
    unit_label: str(formData.get('unit_label')) ?? 'Unit 1',
    tenant_name: str(formData.get('tenant_name')),
    tenant_email: str(formData.get('tenant_email')),
    lease_start: str(formData.get('lease_start')),
    lease_end: str(formData.get('lease_end')),
    monthly_rent: num(formData.get('monthly_rent')),
    deposit_amount: num(formData.get('deposit_amount')),
    move_out_date: str(formData.get('move_out_date')),
    rent_increase_notice_days: num(formData.get('rent_increase_notice_days')),
    license_renewal_date: str(formData.get('license_renewal_date')),
    insurance_renewal_date: str(formData.get('insurance_renewal_date')),
    inspection_date: str(formData.get('inspection_date')),
  });
}

// --- Create ----------------------------------------------------------------

export async function createPropertyWithLease(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireUser();
  const supabase = await createClient();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const v = parsed.data;
  if (!isStateSupported(v.state)) {
    return { error: `${v.state} isn't supported yet (v1 is California only).` };
  }

  // Property
  const { data: property, error: pErr } = await supabase
    .from('properties')
    .insert({
      user_id: user.id,
      nickname: v.nickname,
      address: v.address,
      state: v.state,
    })
    .select()
    .single();
  if (pErr || !property) return { error: pErr?.message ?? 'Could not save property.' };

  // Unit
  const { data: unit, error: uErr } = await supabase
    .from('units')
    .insert({ property_id: property.id, unit_label: v.unit_label })
    .select()
    .single();
  if (uErr || !unit) return { error: uErr?.message ?? 'Could not save unit.' };

  // Lease
  const { data: lease, error: lErr } = await supabase
    .from('leases')
    .insert({
      unit_id: unit.id,
      tenant_name: v.tenant_name,
      tenant_email: v.tenant_email,
      lease_start: v.lease_start,
      lease_end: v.lease_end,
      monthly_rent: v.monthly_rent,
      deposit_amount: v.deposit_amount,
      move_out_date: v.move_out_date,
      rent_increase_notice_days: v.rent_increase_notice_days,
      license_renewal_date: v.license_renewal_date,
      insurance_renewal_date: v.insurance_renewal_date,
      inspection_date: v.inspection_date,
    })
    .select()
    .single();
  if (lErr || !lease) return { error: lErr?.message ?? 'Could not save lease.' };

  await syncLeaseDeadlines(supabase, lease, v.state);

  revalidatePath('/dashboard');
  redirect(`/leases/${lease.id}`);
}

// --- Add a unit + lease to an existing property ----------------------------

const leaseOnlySchema = propertyLeaseSchema.omit({
  nickname: true,
  address: true,
  state: true,
});

export async function addLeaseToProperty(
  propertyId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  // Confirm the property exists / is owned (RLS) and get its state for the rules.
  const { data: property } = await supabase
    .from('properties')
    .select('id, state')
    .eq('id', propertyId)
    .single();
  if (!property) return { error: 'Property not found.' };

  const parsed = leaseOnlySchema.safeParse({
    unit_label: str(formData.get('unit_label')) ?? 'Unit 1',
    tenant_name: str(formData.get('tenant_name')),
    tenant_email: str(formData.get('tenant_email')),
    lease_start: str(formData.get('lease_start')),
    lease_end: str(formData.get('lease_end')),
    monthly_rent: num(formData.get('monthly_rent')),
    deposit_amount: num(formData.get('deposit_amount')),
    move_out_date: str(formData.get('move_out_date')),
    rent_increase_notice_days: num(formData.get('rent_increase_notice_days')),
    license_renewal_date: str(formData.get('license_renewal_date')),
    insurance_renewal_date: str(formData.get('insurance_renewal_date')),
    inspection_date: str(formData.get('inspection_date')),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const v = parsed.data;

  const { data: unit, error: uErr } = await supabase
    .from('units')
    .insert({ property_id: property.id, unit_label: v.unit_label })
    .select()
    .single();
  if (uErr || !unit) return { error: uErr?.message ?? 'Could not save unit.' };

  const { data: lease, error: lErr } = await supabase
    .from('leases')
    .insert({
      unit_id: unit.id,
      tenant_name: v.tenant_name,
      tenant_email: v.tenant_email,
      lease_start: v.lease_start,
      lease_end: v.lease_end,
      monthly_rent: v.monthly_rent,
      deposit_amount: v.deposit_amount,
      move_out_date: v.move_out_date,
      rent_increase_notice_days: v.rent_increase_notice_days,
      license_renewal_date: v.license_renewal_date,
      insurance_renewal_date: v.insurance_renewal_date,
      inspection_date: v.inspection_date,
    })
    .select()
    .single();
  if (lErr || !lease) return { error: lErr?.message ?? 'Could not save lease.' };

  await syncLeaseDeadlines(supabase, lease, property.state);

  revalidatePath('/dashboard');
  revalidatePath('/properties');
  redirect(`/leases/${lease.id}`);
}

// --- Update ----------------------------------------------------------------

export async function updateLease(
  leaseId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const v = parsed.data;
  if (!isStateSupported(v.state)) {
    return { error: `${v.state} isn't supported yet (v1 is California only).` };
  }

  // Find the lease -> unit -> property chain (RLS ensures ownership).
  const { data: lease } = await supabase
    .from('leases')
    .select('id, unit_id')
    .eq('id', leaseId)
    .single();
  if (!lease) return { error: 'Lease not found.' };

  const { data: unit } = await supabase
    .from('units')
    .select('property_id')
    .eq('id', lease.unit_id)
    .single();
  if (!unit) return { error: 'Unit not found.' };
  const propertyId = unit.property_id;

  // Update property + unit + lease.
  await supabase
    .from('properties')
    .update({ nickname: v.nickname, address: v.address, state: v.state })
    .eq('id', propertyId);

  await supabase
    .from('units')
    .update({ unit_label: v.unit_label })
    .eq('id', lease.unit_id);

  const { data: updated, error: lErr } = await supabase
    .from('leases')
    .update({
      tenant_name: v.tenant_name,
      tenant_email: v.tenant_email,
      lease_start: v.lease_start,
      lease_end: v.lease_end,
      monthly_rent: v.monthly_rent,
      deposit_amount: v.deposit_amount,
      move_out_date: v.move_out_date,
      rent_increase_notice_days: v.rent_increase_notice_days,
      license_renewal_date: v.license_renewal_date,
      insurance_renewal_date: v.insurance_renewal_date,
      inspection_date: v.inspection_date,
    })
    .eq('id', leaseId)
    .select()
    .single();
  if (lErr || !updated) return { error: lErr?.message ?? 'Could not update lease.' };

  await syncLeaseDeadlines(supabase, updated, v.state);

  revalidatePath('/dashboard');
  revalidatePath(`/leases/${leaseId}`);
  redirect(`/leases/${leaseId}`);
}

// --- Delete ----------------------------------------------------------------

export async function deleteProperty(propertyId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  // Cascades to units -> leases -> deadlines -> reminder_log.
  await supabase.from('properties').delete().eq('id', propertyId);
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
