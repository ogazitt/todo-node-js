import express = require("express");
import cors = require("cors");
import { Store } from "./store";
import { Server } from "./server";
import { checkJwt, authzMiddleware } from "./auth";
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";

dotenvExpand.expand(dotenv.config());

const app: express.Application = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;

Store.open().then((store) => {
  const server = new Server(store);
  const checkAuthz = authzMiddleware(store);

  app.get("/users/:userID", checkJwt, checkAuthz, server.getUser.bind(server));
  app.get("/todos", checkJwt, checkAuthz, server.list.bind(server));
  app.post("/todos", checkJwt, checkAuthz, server.create.bind(server));
  app.put("/todos/:id", checkJwt, checkAuthz, server.update.bind(server));
  app.delete("/todos/:id", checkJwt, checkAuthz, server.delete.bind(server));

  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
});
