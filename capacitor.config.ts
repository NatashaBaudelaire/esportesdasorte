import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.selecaobet',
  appName: 'SeleçãoBet',
  webDir: 'dist',
  server: {
    url: 'https://76943084-e554-4d6a-8fbd-4140744f619d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
