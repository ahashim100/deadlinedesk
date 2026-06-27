import Link from 'next/link';
import { notFound } from 'next/navigation';
import PropertyLeaseForm from '@/components/PropertyLeaseForm';
import { addLeaseToProperty } from '@/lib/actions/properties';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function NewLeaseForPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, nickname, state')
    .eq('id', id)
    .single();
  if (!property) notFound();

  const action = addLeaseToProperty.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/properties"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to properties
        </Link>
      </div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        Add a unit &amp; lease
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        To <span className="font-medium">{property.nickname}</span> ({property.state}).
        We&apos;ll generate the deadlines automatically.
      </p>
      <PropertyLeaseForm
        action={action}
        includeProperty={false}
        submitLabel="Add unit & lease"
        cancelHref="/properties"
      />
    </div>
  );
}
