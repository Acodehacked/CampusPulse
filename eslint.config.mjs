import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "supabase/.branches/**",
      "supabase/.temp/**",
    ],
  },
];

export default eslintConfig;
