'use client';

import { useTransition } from 'react';

/** A button that confirms, then runs a bound server action. */
export default function ConfirmButton({
  action,
  confirmText,
  children,
  className,
}: {
  action: () => Promise<void>;
  confirmText: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) start(() => action());
      }}
      className={className}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
