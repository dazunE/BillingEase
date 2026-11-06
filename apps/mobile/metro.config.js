// Metro for a monorepo: the app has its own install (it needs a different React from the web
// app), and also reads the shared @billingease/contracts and @billingease/core sources.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [path.join(repoRoot, "packages")];
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules"), path.join(repoRoot, "node_modules")];
// One React and one React Native, always the app's own. The shared packages' own imports (zod)
// resolve from this app's node_modules too, so keep zod in package.json even though app code
// doesn't import it directly.
config.resolver.extraNodeModules = {
  react: path.join(projectRoot, "node_modules/react"),
  "react-native": path.join(projectRoot, "node_modules/react-native"),
  "@billingease/contracts": path.join(repoRoot, "packages/contracts"),
  "@billingease/core": path.join(repoRoot, "packages/core"),
};
module.exports = config;
