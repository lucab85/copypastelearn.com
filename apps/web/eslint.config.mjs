import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...next,
  ...nextCoreWebVitals,
  {
    rules: {
      // New rules introduced by eslint-plugin-react-hooks v7 (Next 16 bump).
      // Existing code uses common SSR-mount patterns; opt in later.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      // Pre-existing patterns flagged by current presets.
      "react/no-unescaped-entities": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "prisma/migrations/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default config;
