import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginAssetsRetry } from "@rsbuild/plugin-assets-retry";
import { pluginImageCompress } from "@rsbuild/plugin-image-compress";

// import { sentryWebpackPlugin } from "@sentry/webpack-plugin";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";

const timeZoneOffset = 9 * 60 * 60 * 1000;
const yyyymmddhhmm = new Date(Date.now() + timeZoneOffset)
  .toISOString()
  .replace(/[^0-9]/g, "")
  .slice(0, -5);

const STAGE = process.env.REACT_APP_STAGE || "alpha";
const SENTRY_PROJECT = "realty-client";
const SENTRY_RELEASE_TARGET = `${SENTRY_PROJECT}@${STAGE}-${yyyymmddhhmm}`;
const reactAppEnv = Object.fromEntries(
  Object.entries({
    ...process.env,
    REACT_APP_STAGE: STAGE,
    REACT_APP_SENTRY_RELEASE_TARGET: SENTRY_RELEASE_TARGET,
  }).filter(([key]) => key.startsWith("REACT_APP_"))
);

const publicEnv = {
  ...reactAppEnv,
  NODE_ENV: process.env.NODE_ENV,
};

const IS_PROD = process.env.NODE_ENV === "production";

export default defineConfig(() => {
  const isLocalBuild = process.env.LOCAL_BUILD === "true";

  return {
    tools: {
      postcss: {
        postcssOptions: {
          plugins: [require("postcss-preset-env")],
        },
      },
      bundlerChain: (chain, { CHAIN_ID }) => {
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        rule.use(CHAIN_ID.USE.SWC).tap((option) => {
          option.jsc.transform.react.importSource = "@emotion/react";
          option.rspackExperiments = {
            ...option.rspackExperiments,
            emotion: true,
            relay: true,
          };

          return option;
        });
      },
    },
    dev: {
      startUrl: true,
    },
    server: {
      port: 3000,
    },
    output: {
      distPath: {
        root: "build",
      },
      polyfill: "entry" as const,
      sourceMap: {
        js: IS_PROD ? "source-map" : "cheap-module-source-map",
      },
    },
    source: {
      include: [/\/node_modules\//],
      define: {
        ...Object.fromEntries(
          Object.entries(publicEnv).map(([key, value]) => [
            `process.env.${key}`,
            `"${value}"`,
          ])
        ),
        "process.env": "{}",
      },
    },
    html: {
      template: "src/index.html",
      templateParameters: {
        process: {
          env: publicEnv,
        },
      },
    },
    performance: {
      chunkSplit: {
        strategy: "split-by-experience" as const,
        forceSplitting: {
          relay: /node_modules\/(relay-runtime|graphql|react-relay)/,
          framerMotion: /node_modules\/framer-motion/,
          sentry: /node_modules\/@sentry/,
          recoil: /node_modules\/recoil/,
        },
      },
    },
    plugins: [pluginReact(), pluginTypeCheck()],
  };
});
