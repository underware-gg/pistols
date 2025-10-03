
//------------------------------------------------------------------------
// misc functions
//
export const _log = (...args) => {
  console.log(`--- `, ...args);
}
export const _error = (message) => {
  console.error(`>>> ${message}`);
}
export const _exit = (messages = 'Bye') => {
  console.error(``);
  console.error(`>>> EXIT...`);
  (Array.isArray(messages) ? messages : [messages]).forEach(m => {
    if (m) console.error(`>>> ${m}`);
  });
  console.error(``);
  process.exit(0);
}
export const _stringify = (obj) => {
  return JSON.stringify(obj, function (k, v) {
    if (v instanceof Array)
      return JSON.stringify(v);
    return v;
  }, 2).replace(/\\/g, '')
    .replace(/\"\[/g, '[')
    .replace(/\]\"/g, ']')
    .replace(/\"\{/g, '{')
    .replace(/\}\"/g, '}');
}
