import express, { type Request } from "express";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import { restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";
import { checkRestaurantExists } from "../middlewares/chechRestaurantId.js";

const router = express.Router();

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
  const data = req.body as Restaurant;

  try {
    const client = await initializeRedisClient();
    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name: data.name, location: data.location };
    const addResult = await client.hSet(restaurantKey, hashData);

    console.log(`Добавлено ${addResult} полей`);

    return successResponse(res, hashData, "Добавлен новый ресторан");
  } catch (error) {
    next(error);
  }

  return res.send("рестики");
});

router.get(
  "/:restaurantId",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;

    try {
      const client = await initializeRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const [viewCount, restaurant] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
      ]);

      return successResponse(res, restaurant);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
