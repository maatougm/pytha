const { withProjectBuildGradle } = require('@expo/config-plugins');

function withKotlinVersion(config) {
  return withProjectBuildGradle(config, async (config) => {
    let buildGradle = config.modResults.contents;
    
    // Replace the kotlinVersion line to explicitly use 1.9.25
    buildGradle = buildGradle.replace(
      /kotlinVersion\s*=\s*findProperty\(['"]android\.kotlinVersion['"]\)\s*\?:\s*['"]1\.9\.\d+['"]/,
      "kotlinVersion = '1.9.25'"
    );
    
    // Also update the ext.kotlinVersion if it exists elsewhere
    buildGradle = buildGradle.replace(
      /ext\.kotlinVersion\s*=\s*['"]1\.9\.\d+['"]/,
      "ext.kotlinVersion = '1.9.25'"
    );
    
    config.modResults.contents = buildGradle;
    return config;
  });
}

module.exports = withKotlinVersion;
