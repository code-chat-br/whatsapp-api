// https://pm2.keymetrics.io/docs/usage/application-declaration/

/**
 * npm run start:pm2
 */

export const apps = [
  {
    name: 'CodeChat Api',
    script: 'npm run start:prod',
    watch: false,
    autorestart: true,
    node_args: ['--max-old-space-size=512'],
    interpreter_args: '--harmony',
    max_memory_restart: '800M',
  },
];
