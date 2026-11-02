import { createServer, type Server } from "node:net";
import { describe, expect, it } from "vitest";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { loadConfig } from "../src/config";
import { SmtpTransport } from "../src/services/email";
import { s3Storage } from "../src/services/storage";

/** Email over SMTP (e.g. Stalwart) and files on an S3-compatible store (e.g. Silo), chosen from the environment. */
describe("provider settings", () => {
  it("sends email over SMTP when SMTP_HOST is set, ahead of Postmark", () => {
    const c = loadConfig({ SMTP_HOST: "mail.example.com", SMTP_USER: "billing@example.com", SMTP_PASSWORD: "pw", POSTMARK_TOKEN: "x" });
    expect(c.email.provider).toBe("smtp");
    expect(c.email.smtp).toEqual({ host: "mail.example.com", port: 465, secure: true, user: "billing@example.com", password: "pw" });
    expect(loadConfig({ SMTP_HOST: "mail.example.com", SMTP_PORT: "587" }).email.smtp).toMatchObject({ port: 587, secure: false });
    expect(loadConfig({}).email.provider).toBe("outbox");
    expect(loadConfig({ POSTMARK_TOKEN: "x" }).email.provider).toBe("postmark");
  });

  it("keeps files in S3 when S3_BUCKET is set, and needs its keys", () => {
    expect(loadConfig({}).storage.s3).toBeNull();
    const c = loadConfig({ S3_BUCKET: "billingease", S3_ENDPOINT: "https://silo.example.com/", S3_ACCESS_KEY_ID: "k", S3_SECRET_ACCESS_KEY: "s", S3_PREFIX: "/prod/" });
    expect(c.storage.s3).toEqual({ endpoint: "https://silo.example.com", region: "us-east-1", bucket: "billingease", accessKeyId: "k", secretAccessKey: "s", forcePathStyle: true, prefix: "prod/" });
    expect(loadConfig({ S3_BUCKET: "b", S3_ENDPOINT: "https://x", S3_ACCESS_KEY_ID: "k", S3_SECRET_ACCESS_KEY: "s", S3_FORCE_PATH_STYLE: "false" }).storage.s3?.forcePathStyle).toBe(false);
    expect(() => loadConfig({ S3_BUCKET: "billingease" })).toThrow(/S3_ACCESS_KEY_ID/);
  });
});

/** A bucket in memory, answering the five commands the store uses. */
function fakeS3() {
  const objects = new Map<string, Uint8Array>();
  const client = {
    async send(cmd: unknown) {
      if (cmd instanceof PutObjectCommand) objects.set(cmd.input.Key!, cmd.input.Body as Uint8Array);
      else if (cmd instanceof GetObjectCommand) {
        const b = objects.get(cmd.input.Key!);
        if (!b) throw Object.assign(new Error("NoSuchKey"), { name: "NoSuchKey" });
        return { Body: { transformToByteArray: async () => b } };
      } else if (cmd instanceof DeleteObjectCommand) objects.delete(cmd.input.Key!);
      else if (cmd instanceof ListObjectsV2Command) {
        const all = [...objects.keys()].filter((k) => k.startsWith(cmd.input.Prefix!)).sort();
        // Like S3, the token carries on after the last key listed, so deleting a page doesn't skip any.
        const after = cmd.input.ContinuationToken;
        const rest = after ? all.filter((k) => k > after) : all;
        const page = rest.slice(0, 2);
        return { Contents: page.map((Key) => ({ Key })), IsTruncated: rest.length > 2, NextContinuationToken: page.at(-1) };
      } else if (cmd instanceof DeleteObjectsCommand) for (const o of cmd.input.Delete!.Objects!) objects.delete(o.Key!);
      return {};
    },
  };
  return { objects, client: client as unknown as S3Client };
}

describe("S3 storage", () => {
  const opts = { endpoint: "https://silo.example.com", region: "us-east-1", bucket: "b", accessKeyId: "k", secretAccessKey: "s", forcePathStyle: true, prefix: "prod/" };
  const biz = "00000000-0000-4000-8000-000000000001", other = "00000000-0000-4000-8000-000000000002";

  it("stores, reads and removes files under the prefix", async () => {
    const { objects, client } = fakeS3();
    const store = s3Storage(opts, client);
    const key = await store.put(biz, new Uint8Array([1, 2, 3]), ".pdf");
    expect(key).toMatch(new RegExp(`^${biz}/[0-9a-f-]{36}\\.pdf$`));
    expect([...objects.keys()]).toEqual([`prod/${key}`]);
    expect([...(await store.get(key))]).toEqual([1, 2, 3]);
    await store.remove(key);
    expect(objects.size).toBe(0);
    await expect(store.get("../etc/passwd")).rejects.toThrow(/Bad storage key/);
  });

  it("removes every file of one business, page by page", async () => {
    const { objects, client } = fakeS3();
    const store = s3Storage(opts, client);
    for (let i = 0; i < 5; i++) await store.put(biz, new Uint8Array([i]), ".png");
    const kept = await store.put(other, new Uint8Array([9]), ".png");
    await store.removeAll(biz);
    expect([...objects.keys()]).toEqual([`prod/${kept}`]);
  });
});

/** A tiny SMTP server that accepts one login and one message, to check what the transport sends. */
function fakeSmtp(): Promise<{ server: Server; port: number; received: Promise<string> }> {
  return new Promise((resolve) => {
    let done: (s: string) => void;
    const received = new Promise<string>((r) => (done = r));
    const server = createServer((sock) => {
      let data = false, body = "";
      sock.write("220 fake ESMTP\r\n");
      sock.on("data", (chunk) => {
        for (const line of chunk.toString().split("\r\n")) {
          if (data) {
            if (line === ".") { data = false; sock.write("250 queued\r\n"); done(body); continue; }
            body += line + "\n";
            continue;
          }
          if (!line) continue;
          const cmd = line.slice(0, 4).toUpperCase();
          if (cmd === "EHLO") sock.write("250-fake\r\n250 AUTH PLAIN\r\n");
          else if (cmd === "AUTH") sock.write("235 ok\r\n");
          else if (cmd === "DATA") { data = true; sock.write("354 go\r\n"); }
          else if (cmd === "QUIT") sock.end("221 bye\r\n");
          else sock.write("250 ok\r\n");
        }
      });
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, port: (server.address() as { port: number }).port, received }));
  });
}

describe("SMTP transport", () => {
  it("sends the message with its PDF and inline logo", async () => {
    const { server, port, received } = await fakeSmtp();
    try {
      // Plain connection only for this local fake: in production 465 is TLS and other ports require STARTTLS.
      const t = new SmtpTransport({ host: "127.0.0.1", port, secure: false, user: "billing@example.com", password: "pw" }, { plain: true });
      await t.send({
        from: "BillingEase <billing@example.com>", to: "client@example.org", replyTo: "owner@example.org", subject: "Invoice INV-1", text: "Hello",
        html: '<img src="cid:logo">', inline: [{ filename: "logo.png", contentType: "image/png", content: new Uint8Array([1]), contentId: "logo" }],
        attachments: [{ filename: "INV-1.pdf", contentType: "application/pdf", content: new Uint8Array([2]) }],
      });
      const msg = await received;
      expect(msg).toMatch(/Subject: Invoice INV-1/);
      expect(msg).toMatch(/Reply-To: owner@example.org/);
      expect(msg).toMatch(/filename=INV-1\.pdf/);
      expect(msg).toMatch(/Content-ID: <logo>/);
    } finally {
      server.close();
    }
  });
});
