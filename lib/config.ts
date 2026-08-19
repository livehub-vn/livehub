/**
 * ============================================================================
 * CẤU HÌNH TRANG WEB
 * ============================================================================
 *
 * Tùy chỉnh trang đích bằng cách chỉnh sửa các giá trị bên dưới.
 * Toàn bộ nội dung, liên kết và thiết lập được tập trung tại đây để dễ quản lý.
 */

export const siteConfig = {
  // Thương hiệu
  name: "LiveHub",
  tagline: "Nhu cầu gặp đúng nhà cung cấp",
  description:
    "LiveHub kết nối khách hàng với nhà cung cấp dịch vụ livestream có kiểm duyệt.",

  // Đường dẫn
  url: "https://livehub-main.vercel.app",

  // Điều hướng
  nav: {
    cta: {
      text: "Xem dịch vụ",
      href: "https://livehub-main.vercel.app/services",
    },
    signIn: {
      text: "Đăng nhập",
      href: "https://livehub-main.vercel.app/login",
    },
  },
};

export const heroConfig = {
  badge: "Nền tảng dịch vụ livestream",
  headline: {
    line1: "Nhu cầu gặp đúng",
    line2: "nhà",
    accent: "cung cấp",
  },
  subheadline:
    "Khách hàng tìm dịch vụ hoặc đăng nhu cầu. Nhà cung cấp đăng dịch vụ và ứng tuyển dự án.",
  cta: {
    text: "Xem dịch vụ",
    href: "https://livehub-main.vercel.app/services",
  },
};

export const blurHeadlineConfig = {
  text: "LiveHub kết nối khách hàng và nhà cung cấp qua các tin dịch vụ, nhu cầu và quy trình có kiểm duyệt.",
};

export const testimonialsConfig = {
  title: "Dành cho nhiều hình thức livestream",
  autoplayInterval: 10000, // mili giây
};

export const howItWorksConfig = {
  title: "Đăng. Duyệt. Kết nối.",
  description:
    "Tạo tin dịch vụ hoặc nhu cầu. LiveHub duyệt trước khi hai bên kết nối.",
  cta: {
    text: "Xem dịch vụ",
    href: "https://livehub-main.vercel.app/services",
  },
};

export const pricingConfig = {
  title: "Hai phía. Một nền tảng.",
  description: "Khách hàng tìm dịch vụ; nhà cung cấp tìm dự án.",
};

export const faqConfig = {
  title: "Bắt đầu với LiveHub",
  description: "Thông tin ngắn về nền tảng.",
  cta: {
    primary: {
      text: "Xem dịch vụ",
      href: "https://livehub-main.vercel.app/services",
    },
    secondary: {
      text: "Liên hệ LiveHub",
      href: "https://livehub-main.vercel.app/contact",
    },
  },
};

export const footerConfig = {
  cta: {
    headline: "Kết nối đúng người cho buổi livestream tiếp theo.",
    button: "Xem dịch vụ",
  },
  copyright: `© ${new Date().getFullYear()} LiveHub. Nền tảng kết nối dịch vụ livestream.`,
};

/**
 * ============================================================================
 * CỜ TÍNH NĂNG
 * ============================================================================
 *
 * Bật hoặc tắt tính năng mà không cần chỉnh sửa mã nguồn component.
 */

export const features = {
  smoothScroll: true,
  testimonialAutoplay: true,
  parallaxHero: true,
  blurInHeadline: true,
};

/**
 * ============================================================================
 * CẤU HÌNH GIAO DIỆN
 * ============================================================================
 *
 * Màu sắc được định nghĩa trong globals.css bằng các thuộc tính CSS tùy chỉnh.
 * Cấu hình này kiểm soát những tính năng giao diện được bật.
 */

export const themeConfig = {
  defaultTheme: "system" as "light" | "dark" | "system",
  enableSystemTheme: true,
};
