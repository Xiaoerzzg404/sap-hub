import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const sentryBuildPluginEnabled = process.env.SENTRY_BUILD_PLUGIN_ENABLED === "true";

export default sentryBuildPluginEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      disableLogger: true,
    })
  : nextConfig;
