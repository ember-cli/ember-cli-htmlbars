module.exports = function addDependencyTracker(plugin, enableInvalidation) {
  if (plugin.prototype && plugin.prototype.transform) {
    // we don't track dependencies for legacy plugins.
    return plugin;
  }
  if (!enableInvalidation) {
    // Dependency invalidation isn't enabled, so no need to track.
    return plugin;
  }
  if (typeof plugin.getDependencies === "function") {
    // Don't add the dependency tracker if it's already added
    return plugin;
  }
  // This variable in our closure allows us to share dependencies from
  // the ast plugin that we can't access with the ast plugin generator that
  // we can access.
  let lastDependencies = {};
  let trackedPlugin = (env) => {
    let realPlugin = plugin(env);
    let visitors = realPlugin.visitor;
    let origProgram = visitors.Program;
    let origEnter, origExit;
    if (origProgram) {
      if (typeof origProgram === "function") {
        origEnter = origProgram;
        origExit = undefined;
      } else {
        origEnter = origProgram.enter;
        origExit = origProgram.exit;
      }
    }
    visitors.Program = {
      enter: (node) => {
        let fileName = node.loc.source;
        if (realPlugin.resetDependencies) {
          realPlugin.resetDependencies();
        }
        delete lastDependencies[fileName];
        if (origEnter) origEnter(node);
      },
      exit: (node) => {
        if (realPlugin.dependencies) {
          let fileName = node.loc.source;
          lastDependencies[fileName] = realPlugin.dependencies(fileName);
        }
        if (origExit) origExit(node)
      }
    };
    return realPlugin;
  };
  trackedPlugin.getDependencies = (filename) => {
    return lastDependencies[filename] || [];
  }
  return trackedPlugin;
};
