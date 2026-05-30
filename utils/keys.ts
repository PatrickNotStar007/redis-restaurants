export const getKeyName = (...args: string[]) => {
  return `redres:${args.join(":")}`;
};

export const restaurantKeyById = (id: string) => {
  return getKeyName("restaurants", id);
};
export const reviewKeyById = (id: string) => {
  return getKeyName("reviews", id);
};
export const reviewDetailsKeyById = (id: string) => {
  return getKeyName("review_details", id);
};

export const cuisinesKey = getKeyName("cuisines");
export const cuisineKey = (name: string) => getKeyName("cuisine", name);
export const restaurantCuisinesKeyById = (id: string) =>
  getKeyName("restaurant_cuisines", id);
