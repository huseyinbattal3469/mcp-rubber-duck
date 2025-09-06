#!/usr/bin/env node

import 'dotenv/config';

(async function main(){
  try {
    const { ConfigManager } = await import('./dist/config/config.js');
    const { ProviderManager } = await import('./dist/providers/manager.js');
    const { HealthMonitor } = await import('./dist/services/health.js');
    const { listDucksTool } = await import('./dist/tools/list-ducks.js');

    const configManager = new ConfigManager();
    const providerManager = new ProviderManager(configManager);
    const healthMonitor = new HealthMonitor(providerManager);

    // Ensure health monitor runs once
    await healthMonitor.performHealthChecks();

    const result = await listDucksTool(providerManager, healthMonitor, { check_health: true });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error running direct list_ducks:', err);
    process.exit(1);
  }
})();
