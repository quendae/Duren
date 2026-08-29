import { DurableObject } from "cloudflare:workers";

const ROOM_TTL_MS = 30 * 60 * 1000;
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const MAX_SIGNAL_MESSAGE_BYTES = 96 * 1024;
const MAX_GUESTS = 2;

function headers(extra = {}) {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extra,
  };
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: headers() }); }
function normalizeRoom(value) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z2-9]/g, "");
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : "";
}
function randomRoom() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}
function randomToken(bytes = 24) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function normalizeNick(value) {
  return String(value || "").normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}
function validNick(value) {
  const nick = normalizeNick(value);
  const length = Array.from(nick).length;
  return length >= 3 && length <= 20 && !/https?:|www\.|[<>@]/iu.test(nick) && /^[\p{L}\p{N} _-]+$/u.test(nick);
}
function validSessionDescription(value, expectedType) {
  return value && value.type === expectedType && typeof value.sdp === "string" && value.sdp.length > 20 && value.sdp.length < MAX_SIGNAL_MESSAGE_BYTES;
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "duren-signaling" });
    }

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ error: "origin_not_allowed" }, 403);
      let body;
      try { body = await request.json(); }
      catch { return json({ error: "invalid_json" }, 400); }
      const nick = normalizeNick(body.nick);
      if (!validNick(nick)) return json({ error: "invalid_nick" }, 400);

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const room = randomRoom();
        const hostToken = randomToken();
        const id = env.ROOMS.idFromName(room);
        const stub = env.ROOMS.get(id);
        const result = await stub.fetch("https://room.internal/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ room, nick, hostToken, createdAt: Date.now(), expiresAt: Date.now() + ROOM_TTL_MS }),
        });
        if (result.status === 409) continue;
        if (!result.ok) return json({ error: "room_creation_failed" }, 500);
        return json({ room, hostToken, expiresAt: Date.now() + ROOM_TTL_MS }, 201);
      }
      return json({ error: "room_collision" }, 503);
    }

    const socketMatch = url.pathname.match(/^\/api\/rooms\/([A-Z2-9-]+)\/socket$/i);
    if (socketMatch && request.method === "GET") {
      if (!sameOrigin(request)) return new Response("Origin not allowed", { status: 403 });
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("Expected WebSocket upgrade", { status: 426 });
      const room = normalizeRoom(socketMatch[1]);
      if (!ROOM_PATTERN.test(room)) return new Response("Invalid room", { status: 400 });
      const id = env.ROOMS.idFromName(room);
      return env.ROOMS.get(id).fetch(new Request("https://room.internal/socket", request));
    }

    return json({ error: "not_found" }, 404);
  },
};

export class SignalingRoom extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/create" && request.method === "POST") {
      const existing = await this.ctx.storage.get("meta");
      if (existing && existing.expiresAt > Date.now()) return new Response("Room already exists", { status: 409 });
      const meta = await request.json();
      await this.ctx.storage.put({ meta, guests: [] });
      await this.ctx.storage.setAlarm(meta.expiresAt);
      return new Response(null, { status: 204 });
    }

    if (url.pathname !== "/socket") return new Response("Not found", { status: 404 });
    const meta = await this.ctx.storage.get("meta");
    if (!meta || meta.expiresAt <= Date.now()) return new Response("Room expired", { status: 404 });
    if (this.ctx.getWebSockets().length >= 10) return new Response("Too many connections", { status: 429 });

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ role: "pending", connectedAt: Date.now() });
    server.send(JSON.stringify({ type: "auth-required", room: meta.room }));
    return new Response(null, { status: 101, webSocket: client });
  }

  sockets(role, guestId = null) {
    return this.ctx.getWebSockets().filter((socket) => {
      const attachment = socket.deserializeAttachment() || {};
      return attachment.role === role && (guestId === null || attachment.guestId === guestId);
    });
  }
  send(socket, message) { try { if (socket.readyState === 1) socket.send(JSON.stringify(message)); } catch {} }
  sendHosts(message) { for (const socket of this.sockets("host")) this.send(socket, message); }
  sendGuest(guestId, message) { for (const socket of this.sockets("guest", guestId)) this.send(socket, message); }
  closeSocket(socket, code, reason) { try { socket.close(code, reason); } catch {} }

  async authenticate(socket, message) {
    const meta = await this.ctx.storage.get("meta");
    if (!meta || meta.expiresAt <= Date.now()) { this.closeSocket(socket, 4004, "Room expired"); return; }

    if (message.role === "host") {
      if (message.token !== meta.hostToken) { this.closeSocket(socket, 4003, "Invalid host token"); return; }
      socket.serializeAttachment({ role: "host", connectedAt: Date.now() });
      const guests = (await this.ctx.storage.get("guests")) || [];
      this.send(socket, { type: "authenticated", role: "host", room: meta.room, guests: guests.map(({ id, nick, offer, connected, seat }) => ({ id, nick, offer, connected, seat })) });
      return;
    }

    if (message.role !== "guest" || !validNick(message.nick)) { this.closeSocket(socket, 4003, "Invalid guest"); return; }
    const guests = (await this.ctx.storage.get("guests")) || [];
    if (guests.length >= MAX_GUESTS) { this.closeSocket(socket, 4009, "Room full"); return; }
    const guest = { id: crypto.randomUUID(), nick: normalizeNick(message.nick), offer: null, answer: null, seat: null, connected: false, joinedAt: Date.now() };
    guests.push(guest);
    await this.ctx.storage.put("guests", guests);
    socket.serializeAttachment({ role: "guest", guestId: guest.id, connectedAt: Date.now() });
    this.send(socket, { type: "authenticated", role: "guest", room: meta.room, guestId: guest.id });
    this.sendHosts({ type: "guest-joined", guestId: guest.id, nick: guest.nick });
  }

  async webSocketMessage(socket, rawMessage) {
    const text = typeof rawMessage === "string" ? rawMessage : new TextDecoder().decode(rawMessage);
    if (text.length > MAX_SIGNAL_MESSAGE_BYTES) { this.closeSocket(socket, 4009, "Message too large"); return; }
    let message;
    try { message = JSON.parse(text); }
    catch { this.closeSocket(socket, 4002, "Invalid message"); return; }

    const attachment = socket.deserializeAttachment() || { role: "pending" };
    if (attachment.role === "pending") {
      if (message.type !== "authenticate") { this.closeSocket(socket, 4003, "Authentication required"); return; }
      await this.authenticate(socket, message);
      return;
    }
    if (attachment.role === "guest") { await this.handleGuestMessage(socket, attachment, message); return; }
    if (attachment.role === "host") await this.handleHostMessage(message);
  }

  async handleGuestMessage(socket, attachment, message) {
    let guests = (await this.ctx.storage.get("guests")) || [];
    const index = guests.findIndex((guest) => guest.id === attachment.guestId);
    if (index < 0) { this.closeSocket(socket, 4004, "Guest session expired"); return; }

    if (message.type === "offer") {
      if (!validSessionDescription(message.sdp, "offer")) { this.closeSocket(socket, 4002, "Invalid WebRTC offer"); return; }
      guests[index].offer = message.sdp;
      await this.ctx.storage.put("guests", guests);
      this.sendHosts({ type: "offer", guestId: attachment.guestId, nick: guests[index].nick, sdp: message.sdp });
      return;
    }
    if (message.type === "connected") {
      guests[index].connected = true;
      await this.ctx.storage.put("guests", guests);
      this.sendHosts({ type: "guest-connected", guestId: attachment.guestId });
      return;
    }
    if (message.type === "leave") {
      guests = guests.filter((guest) => guest.id !== attachment.guestId);
      await this.ctx.storage.put("guests", guests);
      this.sendHosts({ type: "guest-left", guestId: attachment.guestId });
      this.closeSocket(socket, 1000, "Left room");
    }
  }

  async handleHostMessage(message) {
    if (message.type === "answer") {
      if (!validSessionDescription(message.sdp, "answer") || ![1, 2].includes(message.seat)) return;
      const guests = (await this.ctx.storage.get("guests")) || [];
      const index = guests.findIndex((guest) => guest.id === message.guestId);
      if (index < 0) return;
      guests[index].answer = message.sdp;
      guests[index].seat = message.seat;
      await this.ctx.storage.put("guests", guests);
      this.sendGuest(message.guestId, { type: "answer", seat: message.seat, sdp: message.sdp });
      return;
    }
    if (message.type === "reject") {
      let guests = (await this.ctx.storage.get("guests")) || [];
      if (!guests.some((guest) => guest.id === message.guestId)) return;
      this.sendGuest(message.guestId, { type: "rejected", reason: String(message.reason || "rejected") });
      for (const socket of this.sockets("guest", message.guestId)) this.closeSocket(socket, 4009, "Rejected by host");
      guests = guests.filter((guest) => guest.id !== message.guestId);
      await this.ctx.storage.put("guests", guests);
      return;
    }
    if (message.type === "close-room") await this.destroy("Game started");
  }

  async removeDisconnectedGuest(guestId) {
    let guests = (await this.ctx.storage.get("guests")) || [];
    const guest = guests.find((item) => item.id === guestId);
    if (!guest || guest.connected) return;
    guests = guests.filter((item) => item.id !== guestId);
    await this.ctx.storage.put("guests", guests);
    this.sendHosts({ type: "guest-left", guestId });
  }
  async webSocketClose(socket) {
    const attachment = socket.deserializeAttachment() || {};
    if (attachment.role === "guest" && attachment.guestId) await this.removeDisconnectedGuest(attachment.guestId);
  }
  async webSocketError(socket) {
    const attachment = socket.deserializeAttachment() || {};
    if (attachment.role === "guest" && attachment.guestId) await this.removeDisconnectedGuest(attachment.guestId);
  }
  async destroy(reason) {
    for (const socket of this.ctx.getWebSockets()) { this.send(socket, { type: "room-closed", reason }); this.closeSocket(socket, 1000, reason); }
    await this.ctx.storage.deleteAll();
  }
  async alarm() { await this.destroy("Room expired"); }
}
