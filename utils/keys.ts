export const getKeyName = (...args: string[]) => {
  return `redres:${args.join(":")}`;
};

export const restaurantKeyById = (id: string) => {
  return getKeyName("restaurant", id);
};
