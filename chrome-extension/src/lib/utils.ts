
export const cn = (...classes: (string | undefined | null | boolean | { [key: string]: boolean })[]) => {
  const result: string[] = [];
  classes.forEach(c => {
    if (!c) return;
    if (typeof c === 'string') {
      result.push(c);
    } else if (typeof c === 'object') {
      Object.keys(c).forEach(key => {
        if (c[key]) {
          result.push(key);
        }
      });
    }
  });
  return result.join(' ');
};
