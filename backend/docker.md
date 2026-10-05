### **Build and Run**

1. **Build the Docker image** (run from the repository root)
```bash
docker build -t smart-reply-backend ./backend
```

2. **Run the container**
```bash
docker run -d -p 5006:5006 --name smart-reply \
  -e OPENROUTER_API_KEY=your_openrouter_api_key \
  smart-reply-backend
```

* The service listens on **5006** inside and outside the container (`PORT` defaults to `5006`).
* `OPENROUTER_API_KEY` is optional: without it the backend serves its built-in
  zero-latency heuristic engine, and every response is labelled with `"source": "heuristic"`.
* Add `-e REDIS_URL=redis://host:6379` to enable the shared L2 cache tier, or
  `-e TRUST_PROXY=1` when the container runs behind a load balancer so rate
  limiting sees real client IPs.

3. **Verify**
   Open `http://localhost:5006/health` in your browser. You should see:

```json
{ "status": "ok", "service": "smart-reply-backend" }
```

---

The image is built with `npm ci --omit=dev`, runs `node cluster.js` by default
(multi-core workers, self-healing, graceful shutdown), runs as the non-root
`node` user, and ships a `HEALTHCHECK` that polls `/health`.

---
