type LogLevel = 'info' | 'warning' | 'error';

interface LogOptions {
  module: string;
  action: string;
  description: string;
  userId?: string;
}

async function logClient(level: LogLevel, options: LogOptions) {
  try {
    const language = navigator.language.split('-')[0] || 'en'
    await fetch('/api/admin/system/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        ...options,
        language,
      }),
    })
  } catch (error) {
    console.error('Failed to log:', error)
  }
}

export const loggerClient = {
  info: (options: LogOptions) => logClient('info', options),
  warning: (options: LogOptions) => logClient('warning', options),
  error: (options: LogOptions) => logClient('error', options),
}
