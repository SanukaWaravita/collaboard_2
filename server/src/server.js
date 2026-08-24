import "dotenv/config";
import app from "./app.js";
import {
  isDevelopmentSeedEnabled,
} from "./data/inMemoryStore.js";

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(
    `CollabBoard API running at http://localhost:${port}`,
  );

  console.log(
    `Development seed data: ${
      isDevelopmentSeedEnabled
        ? "enabled"
        : "disabled"
    }`,
  );
});