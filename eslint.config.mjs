import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({baseDirectory:dirname(fileURLToPath(import.meta.url))});
const config=[
 {ignores:["next-env.d.ts",".next/**","out/**"]},
 ...compat.extends("next/core-web-vitals","next/typescript"),
 // French apostrophes in existing static editorial JSX. Revisit in the copy-edit pass.
 {rules:{"react/no-unescaped-entities":"off"}}
];
export default config;
