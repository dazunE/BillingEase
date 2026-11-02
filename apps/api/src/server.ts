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

// Which providers are in use, never their secrets.
const { email, storage } = config;
app.log.info({
  email: email.provider === "smtp" ? `smtp ${email.smtp!.host}:${email.smtp!.port}` : email.provider,
  emailFrom: email.from,
  files: storage.s3 ? `s3 ${storage.s3.endpoint ?? "aws"}/${storage.s3.bucket}/${storage.s3.prefix}` : `disk ${storage.dir}`,
}, "providers");
