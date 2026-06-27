import PropertyLeaseForm from '@/components/PropertyLeaseForm';
import { createPropertyWithLease } from '@/lib/actions/properties';
import { requireUser } from '@/lib/auth';

export default async function NewPropertyPage() {
  await requireUser();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Add a property</h1>
      <p className="mb-6 text-sm text-slate-600">
        One property, its unit, and the current lease. We&apos;ll generate the
        deadlines automatically.
      </p>
      <PropertyLeaseForm
        action={createPropertyWithLease}
        submitLabel="Save property"
        cancelHref="/dashboard"
      />
    </div>
  );
}
