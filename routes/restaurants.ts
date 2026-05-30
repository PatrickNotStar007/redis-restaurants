import express, { type Request } from "express";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import {
  cuisineKey,
  cuisinesKey,
  restaurantCuisinesKeyById,
  restaurantKeyById,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import { checkRestaurantExists } from "../middlewares/chechRestaurantId.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

const router = express.Router();

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
  const data = req.body as Restaurant;

  try {
    const client = await initializeRedisClient();

    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name: data.name, location: data.location };

    await Promise.all([
      ...data.cuisines.map((cuisine) =>
        Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantCuisinesKeyById(id), cuisine),
        ]),
      ),
      client.hSet(restaurantKey, hashData),
    ]);

    return successResponse(res, hashData, "Добавлен новый ресторан");
  } catch (error) {
    next(error);
  }

  return res.send("рестики");
});

router.post(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;

    try {
      const client = await initializeRedisClient();

      const reviewId = nanoid();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);

      const reviewData = {
        id: reviewId,
        ...data,
        timeStamp: Date.now(),
        restaurantId,
      };
      await Promise.all([
        client.lPush(reviewKey, reviewId),
        client.hSet(reviewDetailsKey, reviewData),
      ]);

      return successResponse(res, reviewData, "Отзыв добавлен");
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;

    const { page = 1, limit = 10 } = req.query;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);

    try {
      const client = await initializeRedisClient();

      const reviewKey = reviewKeyById(restaurantId);
      const reviewIds = await client.lRange(reviewKey, startIndex, endIndex);
      const reviews = await Promise.all(
        reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id))),
      );

      return successResponse(res, reviews);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExists,
  async (
    req: Request<{ restaurantId: string; reviewId: string }>,
    res,
    next,
  ) => {
    const { restaurantId, reviewId } = req.params;

    try {
      const client = await initializeRedisClient();

      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);

      const [removeResult, deleteResult] = await Promise.all([
        client.lRem(reviewKey, 0, reviewId),
        client.del(reviewDetailsKey),
      ]);

      if (removeResult === 0 && deleteResult === 0)
        return errorResponse(res, 404, "Отзыв не найден");

      return successResponse(res, reviewId, "Отзыв удалён");
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:restaurantId",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;

    try {
      const client = await initializeRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const [viewCount, restaurant, cuisines] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
        client.sMembers(restaurantCuisinesKeyById(restaurantId)),
      ]);

      return successResponse(res, { ...restaurant, cuisines });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
