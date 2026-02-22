import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const baseConfig: NextConfig = {
  /**
   * Configurações de produção.
   * Security headers, otimizações e configuração de imagens.
   */

  // Remover X-Powered-By para não expor framework
  poweredByHeader: false,

  // Security headers globais
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

const nextConfig = withSentryConfig(baseConfig, {
  // Não enviar source maps para o Sentry automaticamente
  // (pode ser habilitado depois com SENTRY_AUTH_TOKEN)
  silent: true,

  // Desabilitar upload de source maps (habilitar quando SENTRY_AUTH_TOKEN estiver configurado)
  sourcemaps: {
    disable: true,
  },

  // Rota de túnel para contornar ad-blockers
  tunnelRoute: '/monitoring',

  // Desabilitar logger do build do Sentry
  disableLogger: true,
})

export default nextConfig;
