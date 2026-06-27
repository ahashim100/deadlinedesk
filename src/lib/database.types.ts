// Hand-written DB types mirroring supabase/migrations/0001_init.sql.
// Regenerate with the Supabase CLI once linked:
//   supabase gen types typescript --linked > src/lib/database.types.ts

export type DeadlineType =
  | 'lease_renewal'
  | 'rent_increase_notice'
  | 'deposit_return'
  | 'inspection'
  | 'insurance_renewal'
  | 'license_renewal';

export type DeadlineStatus = 'upcoming' | 'done' | 'dismissed';
export type DeadlineSource = 'rule' | 'manual';
export type ReminderChannel = 'email' | 'sms';
export type SubscriptionTier = 'free' | 'base' | 'pro';

// NOTE: these are `type` aliases, not `interface`s, on purpose — only object
// type aliases satisfy supabase-js's `Record<string, unknown>` row constraint.
export type Profile = {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  subscription_status: string;
  subscription_tier: SubscriptionTier;
  notify_email: boolean;
  notify_sms: boolean;
  phone: string | null;
  lead_times: number[];
  calendar_token: string;
  cc_recipients: string[];
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  user_id: string;
  nickname: string;
  address: string | null;
  state: string;
  created_at: string;
};

export type Unit = {
  id: string;
  property_id: string;
  unit_label: string;
  created_at: string;
};

export type Lease = {
  id: string;
  unit_id: string;
  tenant_name: string | null;
  tenant_email: string | null;
  lease_start: string | null;
  lease_end: string | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  move_out_date: string | null;
  rent_increase_notice_days: number | null;
  license_renewal_date: string | null;
  insurance_renewal_date: string | null;
  inspection_date: string | null;
  created_at: string;
};

export type Deadline = {
  id: string;
  lease_id: string;
  type: DeadlineType;
  due_date: string;
  status: DeadlineStatus;
  source: DeadlineSource;
  completed_at: string | null;
  completion_note: string | null;
  due_date_overridden: boolean;
  created_at: string;
};

export type ReminderLog = {
  id: string;
  deadline_id: string;
  channel: ReminderChannel;
  lead_time: number;
  sent_at: string;
  status: string;
};

// Database shape for @supabase/supabase-js generics. The Views/Functions/Enums/
// CompositeTypes members must be present (even if empty) or the client's schema
// inference collapses every query result to `never`.
type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string }, Partial<Profile>>;
      properties: TableDef<Property, Omit<Property, 'id' | 'created_at'> & { id?: string }, Partial<Property>>;
      units: TableDef<Unit, Omit<Unit, 'id' | 'created_at'> & { id?: string }, Partial<Unit>>;
      leases: TableDef<Lease, Omit<Lease, 'id' | 'created_at'> & { id?: string }, Partial<Lease>>;
      deadlines: TableDef<
        Deadline,
        Omit<Deadline, 'id' | 'created_at' | 'completed_at' | 'completion_note' | 'due_date_overridden'> & {
          id?: string;
          completed_at?: string | null;
          completion_note?: string | null;
          due_date_overridden?: boolean;
        },
        Partial<Deadline>
      >;
      reminder_log: TableDef<ReminderLog, Omit<ReminderLog, 'id' | 'sent_at'> & { id?: string; sent_at?: string }, Partial<ReminderLog>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      deadline_type: DeadlineType;
      deadline_status: DeadlineStatus;
      deadline_source: DeadlineSource;
      reminder_channel: ReminderChannel;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Deadline display metadata used across the UI.
export const DEADLINE_LABELS: Record<DeadlineType, string> = {
  lease_renewal: 'Lease renewal',
  rent_increase_notice: 'Rent-increase notice',
  deposit_return: 'Security deposit return',
  inspection: 'Inspection',
  insurance_renewal: 'Insurance renewal',
  license_renewal: 'License / registration renewal',
};
