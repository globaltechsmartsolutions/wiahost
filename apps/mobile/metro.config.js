const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);
const mobileWebidlConversions = path.resolve(
  projectRoot,
  "src/lib/polyfills/webidl-conversions.js",
);

function escapePathForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

config.watchFolders = Array.from(new Set([
  ...(config.watchFolders ?? []),
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "node_modules"),
]));
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// pnpm can expose nested React copies through hoisted dependencies. Disabling
// hierarchical lookup keeps native/web exports on the app-level React instance.
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "webidl-conversions") {
    return {
      type: "sourceFile",
      filePath: mobileWebidlConversions,
    };
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};
config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  new RegExp(`${escapePathForRegex(path.resolve(workspaceRoot, "apps/web"))}.*`),
  new RegExp(`${escapePathForRegex(path.resolve(projectRoot, "dist"))}.*`),
  new RegExp(`${escapePathForRegex(path.resolve(projectRoot, ".turbo"))}.*`),
];

module.exports = config;
