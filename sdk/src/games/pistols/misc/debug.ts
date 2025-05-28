import Cookies from 'universal-cookie';

const cookies = new Cookies(null, { path: '/' });

const _isDebug = () => {
  return cookies.get('settings.DEBUG_MODE') === true;
}

export const debug = {
  log: (...args: any[]) => { if (_isDebug()) console.log(...args); },
  warn: (...args: any[]) => { if (_isDebug()) console.warn(...args); },
  error: (...args: any[]) => { if (_isDebug()) console.error(...args); },
}
