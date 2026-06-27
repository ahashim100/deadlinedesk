import { notFound } from 'next/navigation';
import PropertyLeaseForm from '@/components/PropertyLeaseForm';
import { updateLease } from '@/lib/actions/properties';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function EditLeasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: lease } = await supabase
    .from('leases')
    .select(
      `*, unit:units!inner(unit_label, property:properties!inner(nickname, address, state))`,
    )
    .eq('id', id)
    .single();

  if (!lease) notFound();

  const l = lease as unknown as {
    [k: string]: unknown;
    unit: {
      unit_label: string;
      property: { nickname: string; address: string | null; state: string };
    };
  };

  const action = updateLease.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit lease</h1>
      <PropertyLeaseForm
        action={action}
        submitLabel="Save changes"
        cancelHref={`/leases/${id}`}
        defaults={{
          nickname: l.unit.property.nickname,
          address: l.unit.property.address,
          state: l.unit.property.state,
          unit_label: l.unit.unit_label,
          tenant_name: l.tenant_name as string | null,
          tenant_email: l.tenant_email as string | null,
          lease_start: l.lease_start as string | null,
          lease_end: l.lease_end as string | null,
          monthly_rent: l.monthly_rent as number | null,
          deposit_amount: l.deposit_amount as number | null,
          move_out_date: l.move_out_date as string | null,
          rent_increase_notice_days: l.rent_increase_notice_days as number | null,
          license_renewal_date: l.license_renewal_date as string | null,
          insurance_renewal_date: l.insurance_renewal_date as string | null,
          inspection_date: l.inspection_date as string | null,
        }}
      />
    </div>
  );
}
