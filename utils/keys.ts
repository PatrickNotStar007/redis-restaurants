export const getKeyName = (...args: string[]) => {
  return `redres:${args.join(":")}`;
};
