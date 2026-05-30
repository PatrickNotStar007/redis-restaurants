import express from "express";

import restaurantsRouter from "./routes/restaurants.js";
import cuisinesRouterRouter from "./routes/cuisines.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use("/restaurants", restaurantsRouter);
app.use("/cuisines", cuisinesRouterRouter);

app.use(errorHandler);

app
  .listen(PORT, () => {
    console.log(`Приложение запущено на ${PORT} порту`);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
