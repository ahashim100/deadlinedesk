'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { SUPPORTED_STATES } from '@/lib/rules';
import type { ActionResult } from '@/lib/actions/properties';

export interface LeaseFormDefaults {
  nickname?: string;
  address?: string | null;
  state?: string;
  unit_label?: string;
  tenant_name?: string | null;
  tenant_email?: string | null;
  lease_start?: string | null;
  lease_end?: string | null;
  monthly_rent?: number | null;
  deposit_amount?: number | null;
  move_out_date?: string | null;
  rent_increase_notice_days?: number | null;
  license_renewal_date?: string | null;
  insurance_renewal_date?: string | null;
  inspection_date?: string | null;
}

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export default function PropertyLeaseForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
  includeProperty = true,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  defaults?: LeaseFormDefaults;
  submitLabel: string;
  cancelHref: string;
  /** When false, hides the property fields (for adding a lease to an existing property). */
  includeProperty?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-8">
      {/* Property + Unit */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          {includeProperty ? 'Property & unit' : 'Unit'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {includeProperty && (
            <>
              <Field label="Nickname *">
                <input
                  name="nickname"
                  required
                  defaultValue={defaults.nickname ?? ''}
                  placeholder="Maple St Duplex"
                  className={inputClass}
                />
              </Field>
              <Field label="State *">
                <select
                  name="state"
                  defaultValue={defaults.state ?? 'CA'}
                  className={inputClass}
                >
                  {SUPPORTED_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <input
                    name="address"
                    defaultValue={defaults.address ?? ''}
                    placeholder="123 Maple St, Oakland, CA"
                    className={inputClass}
                  />
                </Field>
              </div>
            </>
          )}
          <Field label="Unit label *">
            <input
              name="unit_label"
              required
              defaultValue={defaults.unit_label ?? 'Unit 1'}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Lease */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Lease</h2>
        <p className="mb-4 text-sm text-slate-500">
          Fill in what you know. We&apos;ll create reminders from any dates you
          provide.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tenant name">
            <input
              name="tenant_name"
              defaultValue={defaults.tenant_name ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Tenant email">
            <input
              name="tenant_email"
              type="email"
              defaultValue={defaults.tenant_email ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Lease start">
            <input
              name="lease_start"
              type="date"
              defaultValue={defaults.lease_start ?? ''}
              className={inputClass}
            />
          </Field>
          <Field
            label="Lease end"
            hint="Creates a lease-renewal reminder."
          >
            <input
              name="lease_end"
              type="date"
              defaultValue={defaults.lease_end ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Monthly rent">
            <input
              name="monthly_rent"
              type="number"
              min="0"
              step="1"
              defaultValue={defaults.monthly_rent ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Deposit amount">
            <input
              name="deposit_amount"
              type="number"
              min="0"
              step="1"
              defaultValue={defaults.deposit_amount ?? ''}
              className={inputClass}
            />
          </Field>
          <Field
            label="Move-out date"
            hint="Creates a deposit-return reminder (CA: +21 days)."
          >
            <input
              name="move_out_date"
              type="date"
              defaultValue={defaults.move_out_date ?? ''}
              className={inputClass}
            />
          </Field>
          <Field
            label="Rent-increase notice (days)"
            hint="CA: 30 days for ≤10%, 90 days for >10%. Reminds you before lease end."
          >
            <input
              name="rent_increase_notice_days"
              type="number"
              min="0"
              step="1"
              defaultValue={defaults.rent_increase_notice_days ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Inspection date">
            <input
              name="inspection_date"
              type="date"
              defaultValue={defaults.inspection_date ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Insurance renewal date">
            <input
              name="insurance_renewal_date"
              type="date"
              defaultValue={defaults.insurance_renewal_date ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="License / registration renewal date">
            <input
              name="license_renewal_date"
              type="date"
              defaultValue={defaults.license_renewal_date ?? ''}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
