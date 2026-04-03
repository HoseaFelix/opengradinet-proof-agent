import os
import json
import traceback
import asyncio
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import opengradient as og

# Avoid importing x402 libraries directly (dependency names differ across opengradient versions).
# This is the Permit2 address used by OpenGradient's x402 stack (Base Sepolia).
PERMIT2_ADDRESS = (os.environ.get("OG_PERMIT2_ADDRESS") or "0xA2820a4d4F3A8c5Fa4eaEBF45B093173105a8f8F").strip()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    # Keep this conservative: higher values can easily trigger x402 402s on small balances.
    max_tokens: Optional[int] = 256
    temperature: Optional[float] = 0.1
    stream: Optional[bool] = False
    settlement_mode: Optional[str] = None


load_dotenv()

app = FastAPI()

# Next.js dev server (default) + optional custom frontend origin.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
extra_origin = os.environ.get("OG_PY_CORS_ORIGIN")
if extra_origin:
    origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_llm: Optional[og.LLM] = None
logger = logging.getLogger(__name__)


def get_llm() -> og.LLM:
    global _llm
    if _llm is None:
        private_key = os.environ.get("OG_PRIVATE_KEY")
        if not private_key:
            raise RuntimeError("OG_PRIVATE_KEY is not set")

        llm_server_url = os.environ.get("OG_LLM_SERVER_URL")
        if llm_server_url:
            _llm = og.LLM(private_key=private_key, llm_server_url=llm_server_url)
        else:
            _llm = og.LLM(private_key=private_key)

    return _llm


async def ensure_opg_approval_async(llm: og.LLM) -> None:
    # SDK >= 0.9.x uses:
    #   ensure_opg_approval(min_allowance, approve_amount=None)
    # Older SDKs used:
    #   ensure_opg_approval(opg_amount)
    #
    # Keep this low by default so a fresh wallet can run without requiring 5 OPG.
    min_allowance = float(os.environ.get("OG_MIN_ALLOWANCE", os.environ.get("OG_OPG_APPROVAL", "0.1")))
    approve_amount_raw = (os.environ.get("OG_APPROVE_AMOUNT") or "").strip()
    approve_amount: Optional[float] = float(approve_amount_raw) if approve_amount_raw else None

    # Idempotent: only sends a tx if allowance is below threshold.
    # A previously submitted approval can leave a transient nonce conflict.
    try:
        try:
            # Newer SDK: (min_allowance, approve_amount=None)
            await asyncio.to_thread(llm.ensure_opg_approval, min_allowance, approve_amount)
        except TypeError:
            # Older SDK: (opg_amount)
            await asyncio.to_thread(llm.ensure_opg_approval, min_allowance)
    except ValueError as exc:
        # Example: "insufficient OPG balance ... Fund the wallet before approving."
        # Don't crash the whole request/stream; the actual inference will return 402 anyway.
        logger.warning("Skipping OPG approval check: %s", exc)
    except Exception as exc:
        message = str(exc).lower()
        if any(
            fragment in message
            for fragment in ("nonce too low", "already known", "replacement transaction underpriced")
        ):
            logger.warning("Skipping duplicate approval attempt: %s", exc)
        else:
            raise


@app.get("/healthz")
def healthz() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/models")
def list_models() -> Dict[str, Any]:
    data: List[Dict[str, Any]] = []
    try:
        enum = og.TEE_LLM
        for member in list(enum):
            value = getattr(member, "value", None)
            data.append(
                {
                    "id": value if isinstance(value, str) else str(member),
                    "name": getattr(member, "name", str(member)),
                }
            )
    except Exception:
        data = []
    return {"object": "list", "data": data}


@app.get("/debug/opg")
def debug_opg() -> Dict[str, Any]:
    from eth_account import Account
    from web3 import Web3

    private_key = os.environ.get("OG_PRIVATE_KEY")
    if not private_key:
        raise HTTPException(status_code=500, detail="OG_PRIVATE_KEY is not set")

    min_allowance = float(os.environ.get("OG_MIN_ALLOWANCE", os.environ.get("OG_OPG_APPROVAL", "0.1")))
    approve_amount_raw = (os.environ.get("OG_APPROVE_AMOUNT") or "").strip()
    approve_amount = float(approve_amount_raw) if approve_amount_raw else None
    account = Account.from_key(private_key)
    address = Web3.to_checksum_address(account.address)

    # Mirror SDK defaults (Base Sepolia + OPG token + Permit2).
    rpc_url = "https://sepolia.base.org"
    opg_token_address = "0x240b09731D96979f50B2C649C9CE10FcF9C7987F"

    erc20_abi = [
        {
            "inputs": [{"name": "owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function",
        },
        {
            "inputs": [
                {"name": "owner", "type": "address"},
                {"name": "spender", "type": "address"},
            ],
            "name": "allowance",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function",
        },
    ]

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    token = w3.eth.contract(address=Web3.to_checksum_address(opg_token_address), abi=erc20_abi)
    allowance = token.functions.allowance(address, Web3.to_checksum_address(PERMIT2_ADDRESS)).call()
    balance = token.functions.balanceOf(address).call()
    eth_balance = w3.eth.get_balance(address)

    return {
        "address": address,
        "network": "base-sepolia",
        "rpc_url": rpc_url,
        "opg_token": opg_token_address,
        "permit2": PERMIT2_ADDRESS,
        "min_allowance": min_allowance,
        "approve_amount": approve_amount,
        "opg_balance": float(balance) / 1e18,
        "permit2_allowance": float(allowance) / 1e18,
        "eth_balance": float(eth_balance) / 1e18,
        "chain_id": w3.eth.chain_id,
    }


def resolve_model(model: str) -> str:
    model = (model or "").strip()
    if not model:
        raise ValueError("model is required")

    # UI-friendly aliases used in the Next.js app.
    aliases: Dict[str, str] = {
        "gpt-5": "openai/gpt-5",
        "gpt-5-mini": "openai/gpt-5-mini",
        "gpt-5.2": "openai/gpt-5.2",
        "claude-sonnet-4-6": "anthropic/claude-sonnet-4-6",
        "claude-opus-4-6": "anthropic/claude-opus-4-6",
        "grok-4": "x-ai/grok-4",
        "gemini-3-flash": "google/gemini-3-flash-preview",
    }
    if model in aliases:
        return aliases[model]

    # Common accidental stringification of the Enum (e.g. "TEE_LLM.GPT_5_2").
    if model.startswith("TEE_LLM."):
        model = model.split(".", 1)[1]

    # If a provider prefix is already present, keep as-is (e.g. "openai/gpt-5.2").
    if "/" in model:
        return model

    try:
        enum = og.TEE_LLM
    except Exception:
        return model

    # Try normalized name match (e.g. "gpt-5.2" -> "GPT_5_2").
    normalized = model.upper().replace("/", "_").replace("-", "_").replace(".", "_")
    if hasattr(enum, normalized):
        member = getattr(enum, normalized)
        return getattr(member, "value", str(member))

    # Try matching against the model-id part of known values.
    matches: List[str] = []
    try:
        for member in list(enum):
            value = getattr(member, "value", None)
            if not isinstance(value, str):
                continue
            _, _, model_id = value.partition("/")
            if model_id == model:
                matches.append(value)
    except Exception:
        matches = []

    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        raise ValueError(f"ambiguous model '{model}'; use provider/model (e.g. '{matches[0]}')")

    # Fallback: assume a default provider to avoid the SDK crashing on `split('/')`.
    # This keeps the API tolerant of UIs that send plain model ids like "gpt-4o-mini".
    default_provider = (os.environ.get("OG_DEFAULT_PROVIDER") or "openai").strip()
    logger.warning("Unknown model '%s'; defaulting to %s/%s", model, default_provider, model)
    return f"{default_provider}/{model}"


def resolve_settlement_mode(mode: Optional[str]) -> og.types.x402SettlementMode:
    if not mode:
        return og.types.x402SettlementMode.BATCH_HASHED
    mode = mode.strip().lower()
    if mode in ("private",):
        return og.types.x402SettlementMode.PRIVATE
    if mode in ("batch", "batch_hashed", "hashed"):
        return og.types.x402SettlementMode.BATCH_HASHED
    if mode in ("individual", "individual_full", "full"):
        return og.types.x402SettlementMode.INDIVIDUAL_FULL
    raise ValueError("settlement_mode must be one of: private, batch, individual")


def resolve_max_tokens(requested: Optional[int]) -> int:
    default_max = int(os.environ.get("OG_MAX_TOKENS_DEFAULT", "256"))
    cap = int(os.environ.get("OG_MAX_TOKENS_CAP", "1024"))
    max_tokens = int(requested or default_max)
    if max_tokens < 1:
        max_tokens = default_max
    if cap > 0:
        max_tokens = min(max_tokens, cap)
    return max_tokens


async def _stream_sse(payload: ChatRequest, resolved_model: str) -> AsyncGenerator[str, None]:
    """Yield SSE lines in an OpenAI-like format.

    Note: Some upstream providers/gateways don't reliably emit incremental deltas.
    To keep the frontend UX consistent, we run a single non-streaming inference
    and wrap it as a 1-chunk SSE stream.
    """
    llm = get_llm()
    await ensure_opg_approval_async(llm)
    settlement_mode = resolve_settlement_mode(payload.settlement_mode)

    def _error_event(message: str) -> str:
        return f"event: error\ndata: {json.dumps({'error': {'message': message}})}\n\n"

    try:
        result = await llm.chat(
            model=resolved_model,
            messages=[m.model_dump() for m in payload.messages],
            max_tokens=resolve_max_tokens(payload.max_tokens),
            temperature=payload.temperature or 0.1,
            x402_settlement_mode=settlement_mode,
            stream=False,
        )
    except RuntimeError as exc:
        yield _error_event(str(exc))
        yield "data: [DONE]\n\n"
        return

    content: Any = None
    if hasattr(result, "chat_output") and result.chat_output:
        content = result.chat_output.get("content")
    if content is None and hasattr(result, "completion_output"):
        content = result.completion_output

    if isinstance(content, list):
        content = " ".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()

    if content is None:
        content = ""

    sse_data: Dict[str, Any] = {
        "id": getattr(result, "tee_id", None) or getattr(result, "payment_hash", None) or "og-stream",
        "object": "chat.completion.chunk",
        "model": resolved_model,
        "choices": [
            {
                "index": 0,
                "delta": {"role": "assistant", "content": str(content)},
                "finish_reason": getattr(result, "finish_reason", None) or "stop",
            }
        ],
    }
    yield f"data: {json.dumps(sse_data)}\n\n"
    yield "data: [DONE]\n\n"


@app.post("/v1/chat/completions")
async def chat_completions(payload: ChatRequest):
    try:
        # ── Streaming path ────────────────────────────────────────────────
        if payload.stream:
            resolved_model = resolve_model(payload.model)
            return StreamingResponse(
                _stream_sse(payload, resolved_model),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )

        # ── Non-streaming path ────────────────────────────────────────────
        llm = get_llm()
        await ensure_opg_approval_async(llm)
        resolved_model = resolve_model(payload.model)
        settlement_mode = resolve_settlement_mode(payload.settlement_mode)
        result = await llm.chat(
            model=resolved_model,
            messages=[m.model_dump() for m in payload.messages],
            max_tokens=resolve_max_tokens(payload.max_tokens),
            temperature=payload.temperature or 0.1,
            x402_settlement_mode=settlement_mode,
        )

        content = None
        payment_hash = None

        if hasattr(result, "chat_output"):
            try:
                content = result.chat_output.get("content")
            except Exception:
                content = None
        if content is None and hasattr(result, "completion_output"):
            content = result.completion_output

        if hasattr(result, "payment_hash"):
            payment_hash = result.payment_hash

        if isinstance(content, list):
            # Some providers return structured content blocks.
            content = " ".join(
                block.get("text", "")
                for block in content
                if isinstance(block, dict) and block.get("type") == "text"
            ).strip()

        if content is None:
            content = str(result)

        finish_reason = getattr(result, "finish_reason", None) or "stop"
        if finish_reason in ("length", "max_tokens") and isinstance(content, str):
            content = content.rstrip() + "\n\n[Truncated: increase max_tokens]"

        # OpenAI-compatible response shape
        return {
            "id": "og-chat",
            "object": "chat.completion",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": content},
                    "finish_reason": finish_reason,
                }
            ],
            "payment": {"hash": payment_hash},
        }
    except RuntimeError as err:
        traceback.print_exc()
        message = str(err)
        if "status 402" in message:
            raise HTTPException(status_code=402, detail=message) from err
        raise HTTPException(status_code=500, detail=message) from err
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(err)) from err
