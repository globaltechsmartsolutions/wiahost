const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.blockList = [
  ...config.resolver.blockList,
  new RegExp(`${path.resolve(workspaceRoot, "apps/web").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`),
  new RegExp(`${path.resolve(projectRoot, "dist").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`),
  new RegExp(`${path.resolve(projectRoot, ".turbo").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`),
];

module.exports = config;
