import { connect } from "@billingease/db";
import { buildApp } from "./app";
import { loadConfig } from "./config";
import { createServices } from "./services";
import { startJobs } from "./jobs";

const config = loadConfig();
const { db, close } = await connect();
const services = createServices(config);
const app = await buildApp({ db, config, services });
const stopJobs = startJobs(app);

const shutdown = async () => {
  stopJobs();
  await app.close();
  await close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await app.listen({ host: config.host, port: config.port });
