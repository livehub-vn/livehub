import type { Profile, UserRole } from "./types/database";

const DEFAULT_CUSTOMER_PROFILE: Profile = {
  id: "00000000-0000-4000-8000-000000000003",
  email: "vietnammedia@livehub.vn",
  full_name: "Tập đoàn Truyền thông V-Brand (Golden VIP)",
  phone: "0977665544",
  avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces",
  role: "customer",
  membership_tier: "premium",
  membership_status: "active",
  bio: "Doanh nghiệp tổ chức sự kiện quốc tế và bán lẻ đa kênh trực tuyến.",
  created_at: new Date().toISOString(),
};

const DEFAULT_PROVIDER_PROFILE: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "saigonstudio@livehub.vn",
  full_name: "Saigon Cinema & Studio Production",
  phone: "0908889999",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
  role: "provider",
  membership_tier: "premium",
  membership_status: "active",
  bio: "Đơn vị cung cấp thiết bị máy quay điện ảnh, studio cách âm và ekip livestream chuyên nghiệp.",
  created_at: new Date().toISOString(),
};

const DEFAULT_ADMIN_PROFILE: Profile = {
  id: "00000000-0000-4000-8000-000000000009",
  email: "livehubwork@gmail.com",
  full_name: "Official LiveHub",
  phone: "0999999999",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
  role: "admin",
  membership_tier: "premium",
  membership_status: "active",
  bio: "Tài khoản Quản trị viên tối cao hệ thống LiveHub.",
  created_at: new Date().toISOString(),
};

export const DEMO_PROFILES = {
  customer: DEFAULT_CUSTOMER_PROFILE,
  provider: DEFAULT_PROVIDER_PROFILE,
  admin: DEFAULT_ADMIN_PROFILE,
};

const STORAGE_KEY = "livehub_active_role";

export function getActiveDemoRole(): UserRole {
  if (typeof window === "undefined") return "customer";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "provider" || saved === "customer" || saved === "admin") {
      return saved as UserRole;
    }
  } catch {
    // Ignore localStorage errors
  }
  return "customer";
}

export function setActiveDemoRole(role: UserRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, role);
    window.dispatchEvent(new Event("livehub:profile-updated"));
  } catch {
    // Ignore localStorage errors
  }
}

export function getFallbackProfile(role?: UserRole): Profile {
  const activeRole = role || getActiveDemoRole();
  if (activeRole === "admin") return DEFAULT_ADMIN_PROFILE;
  return activeRole === "provider" ? DEFAULT_PROVIDER_PROFILE : DEFAULT_CUSTOMER_PROFILE;
}
