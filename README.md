# Market Direction Demo Lab

A local-only, clearly labeled educational chart simulator. It is **not** connected to any broker,
exchange, or trading venue and does not imitate Pocket Option or any other real platform.

The demo lets a presenter trigger directional chart animations with **Up**, **Down**, and **Neutral**
controls. It intentionally includes visible simulation notices and a neutral “demo score” instead of
fake account balances or real trade outcomes.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8080
```

Then visit <http://localhost:8080>.

## Safety boundaries

- No external network calls.
- No broker branding, logos, or claims of real trading.
- Persistent watermark and status copy disclose that all motion and outcomes are simulated.
- Demo score is non-financial and is labeled as presentation feedback only.
