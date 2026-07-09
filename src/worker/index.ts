export { AssetBinding } from "./assets";

import { app } from "./app";
import type { Env, WorkerContext } from "./env";

export default {
  fetch(request: Request, env: Env, ctx: WorkerContext) {
    return app.fetch(request, env, ctx);
  },
};
