import type { Metadata } from "next";

export const siteConfig = {
  name: "LiveHub",
  description:
    "LiveHub kết nối khách hàng với nhà cung cấp dịch vụ livestream có kiểm duyệt.",
  url: "https://livehub-main.vercel.app",
  ogImage: "/brand/livehub-social-card.jpg",
  creator: "LiveHub",
  authors: [
    {
      name: "LiveHub",
      url: "https://livehub-main.vercel.app",
    },
  ],
  keywords: [
    "dịch vụ livestream",
    "nền tảng kết nối dịch vụ livestream",
    "sàn dịch vụ livestream",
    "nhà cung cấp dịch vụ livestream",
    "đăng nhu cầu livestream",
    "thuê thiết bị livestream",
    "sản xuất livestream",
    "ê-kíp livestream",
    "thuê studio livestream",
    "nền tảng livestream Việt Nam",
  ],
} as const;

export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "LiveHub | Nền tảng kết nối dịch vụ livestream",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [...siteConfig.authors],
  creator: siteConfig.creator,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteConfig.url,
    title: "LiveHub | Nền tảng kết nối dịch vụ livestream",
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "LiveHub - Nền tảng kết nối dịch vụ livestream",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveHub | Nền tảng kết nối dịch vụ livestream",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/Logo.png",
    apple: "/icon-192.png",
  },
  manifest: "/site.webmanifest",
};

export function createMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image ?? siteConfig.ogImage;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: title ?? siteConfig.name,
      description: description ?? siteConfig.description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title ?? siteConfig.name,
        },
      ],
    },
    twitter: {
      title: title ?? siteConfig.name,
      description: description ?? siteConfig.description,
      images: [ogImage],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
