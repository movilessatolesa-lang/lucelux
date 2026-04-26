import { readdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadFlatCompat() {
  try {
    return (await import("@eslint/eslintrc")).FlatCompat;
  } catch {
    const pnpmDir = `${__dirname}/node_modules/.pnpm`;
    const eslintrcDir = readdirSync(pnpmDir).find((entry) =>
      entry.startsWith("@eslint+eslintrc@")
    );

    if (!eslintrcDir) {
      throw new Error(
        "No se pudo resolver @eslint/eslintrc para la configuracion de ESLint."
      );
    }

    const moduleUrl = pathToFileURL(
      `${pnpmDir}/${eslintrcDir}/node_modules/@eslint/eslintrc/lib/index.js`
    ).href;

    return (await import(moduleUrl)).FlatCompat;
  }
}

const FlatCompat = await loadFlatCompat();

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
