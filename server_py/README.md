## OpenGradient Python SDK Server

This is an optional helper service that uses the OpenGradient Python SDK to handle x402 payment flows.

### Run

```bash
cd server_py
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OG_PRIVATE_KEY=0x...
uvicorn app:app --reload --port 8787
```

### Next.js integration

Set in your Next.js `.env.local`:

```bash
OG_PY_SERVER_URL=http://127.0.0.1:8787
```

Then restart `npm run dev`.

