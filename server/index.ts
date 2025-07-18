import { Hono } from "hono";
import { upload } from "./utils/upyun";
import { authMiddleware } from "./auth";

const app = new Hono().basePath("/api");

app.use("*", authMiddleware);

app.get("/get", async (c) => {
  return c.json({ name: "hello" });
});

app.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  const folder = body["folder"] as string | undefined;
  const data = await upload(file, folder);
  return c.json(data);
});

export default app;
