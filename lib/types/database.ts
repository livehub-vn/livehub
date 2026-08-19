export type UserRole = "customer" | "provider" | "admin";
export type ServiceCategory = "equipment" | "studio" | "crew" | "operator";
export type ListingStatus = "pending" | "approved" | "rejected" | "closed";
export type RentalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export type MembershipTier = "free_trial" | "basic" | "standard" | "premium";
export type MembershipStatus = "active" | "expiring_soon" | "expired";

export type PaymentMethod = "vietqr" | "vnpay" | "momo" | "zalopay" | "card";
export type PaymentStatus =
  "pending_payment" | "processing" | "completed" | "failed" | "refunded";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  membership_tier?: MembershipTier;
  trial_ends_at?: string | null;
  membership_status?: MembershipStatus;
  created_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price_per_day: number;
  location: string;
  status: ListingStatus;
  rejection_reason?: string | null;
  specs?: Record<string, unknown> | null;
  images: string[];
  created_at: string;
  provider?: Profile;
}

export interface Demand {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  event_date: string;
  status: ListingStatus;
  rejection_reason?: string | null;
  requirements?: Record<string, unknown> | null;
  images?: string[];
  created_at: string;
  customer?: Profile;
}

export interface ServiceRental {
  id: string;
  service_id: string;
  customer_id: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  notes?: string | null;
  status: RentalStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  created_at: string;
  service?: Service;
  customer?: Profile;
  provider?: Profile;
}

export interface DemandApplication {
  id: string;
  demand_id: string;
  provider_id: string;
  proposed_price: number;
  proposal_note: string;
  status: ApplicationStatus;
  created_at: string;
  demand?: Demand;
  provider?: Profile;
}

export interface Review {
  id: string;
  service_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: Profile;
}

export interface Transaction {
  id: string;
  order_code: string;
  user_id: string;
  rental_id?: string | null;
  package_booking_id?: string | null;
  membership_tier?: MembershipTier | null;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_ref?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface TurnkeyPackageBooking {
  id: string;
  user_id?: string | null;
  package_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  location: string;
  notes?: string;
  estimated_price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  updated_at?: string;
}
