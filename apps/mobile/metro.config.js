const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);
const mobileWebidlConversions = path.resolve(
  workspaceRoot,
  "node_modules/.pnpm/whatwg-url@5.0.0/node_modules/webidl-conversions/lib/index.js",
);

config.watchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;
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
  ...config.resolver.blockList,
  new RegExp(`${path.resolve(workspaceRoot, "apps/web").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`),
  new RegExp(`${path.resolve(projectRoot, "dist").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`),
  new RegExp(`${path.resolve(projectRoot, ".turbo").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`),
];

module.exports = config;
