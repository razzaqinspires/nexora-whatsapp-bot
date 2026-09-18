# NEXORA WhatsApp Bot V15.0.3

NEXORA V14 is a modular WhatsApp automation, AI-agent and RPG platform under the NEXORA technology ecosystem.

## V14 focus
- Full-canvas RPG presentation using Sharp-generated SVG/PNG.
- Character sheets with core, offensive and defensive stats.
- Event-driven ongoing PvE combat with HP/MP/Energy, cooldowns, hit/miss, criticals, penetration, block, CC, DoT/HoT, shields, buffs/debuffs, lifesteal and boss phases foundation.
- Enemy Codex, Dungeon Codex, Battle Proof and Story Chronicle canvases.
- Expanded enemy catalog and four dungeon arcs.
- Persistent combat snapshots and JSONL event memory.
- Smart cache: bounded in-memory LRU + persistent disk cache with TTL.
- NEXORA Chronicle story designed around Echo, memory, self-model and the road toward Artificial Consciousness research; this is a fictional/experimental game layer, not a claim of sentience.
- Owner controls: sandboxed diagnostic `eval`, cache control, memory compaction, scheduler/maintenance controls.
- Existing AI multi-provider routing, group tools, downloader, Instagram automation, economy, guilds, quests, gacha, equipment and quick buttons are retained.

## RPG commands
`.character`
`.enemy list`
`.enemy abyss_dragon`
`.battle cyber_wolf`
`.battle status`
`.skill power`
`.skill frost`
`.skill lifesteal`
`.battleproof`
`.flee`
`.dungeon list`
`.dungeon singularity_core`
`.dungeon enter`
`.map`
`.story`
`.story next`

## Persistence
- `data/state.json`: operational/game state.
- `data/memory/events.jsonl`: append-only event history.
- `data/memory/snapshot.json`: compact memory index.
- `data/cache/`: persistent render/cache entries.

The term “memori abadi” in this project means durable append-only history until an operator deletes/rotates it; it is not literally infinite storage.

## Owner controls
`.eval <javascript>` — restricted diagnostic VM; no `process`/`require` context is exposed.
`.ownerctl maintenance on|off`
`.ownerctl scheduler pause|resume`
`.ownerctl compact`
`.ownerctl cache`
`.memory stats`
`.cache stats`
`.cache clear`

## AI toward Artificial Consciousness
V14 adds a research-oriented narrative and persistent event substrate that can support future metacognitive features: self-state, episodic recall, goal tracking, reflection logs, uncertainty and tool/action verification. These mechanisms are software architecture; they do not establish consciousness.

## Install
1. Node.js >= 20.
2. `npm install`.
3. Copy `.env.example` to `.env` and configure WhatsApp auth, owner IDs and AI providers.
4. Keep `DRY_RUN=true` until external integrations are verified.
5. `npm run check` and `npm test`.

Never commit API keys or session files. Rotate any key that has been exposed.

## V15.0.0 — Menu / Serializer / Jadibot Stability
- Dynamic menu categories are generated from the actual plugin registry; no duplicated hard-coded category command lists.
- Menu supports persistent owner settings: description/args visibility, numbering, A-Z sorting, renderer type, safe symbol-font presets, widgets, command hide/show.
- Per-call flags: `menu --ignore desc`, `menu --ignore args`, `menu --ignore desc,args`, `menu --number`, `menu --az`, `menu --type=image|buttons|list|carousel|text`.
- Owner menu control: `.menuset status|ignore|show|number|sort|type|font|replace|widget|hide|showcmd|category|reset`.
- Serializer extracts text from legacy button/list replies and native interactive response `paramsJson`; message normalization includes current wrapper types. WhiskeySockets documents `normalizeMessageContent`, `getContentType`, LID/PN utilities, `additionalNodes`, and relay options; Baileys 7.x also carries breaking changes, so the renderer has deterministic fallbacks. 
- `.jadibot start <nomor> [hari]`, `.jadibot status`, `.jadibot stop`: premium child-bot session foundation with isolated auth directories and expiry.
- Auth/session files remain ignored; `.gitignore` covers auth trees, credentials/session JSON, DB journals, environment secrets, and runtime directories.


## V15.0.3
- Native Flow mengikuti serializer kompatibilitas: binary envelope `mixed`; list menggunakan `single_select` button.
- Ping menggunakan AIRich sebagai jalur utama dan externalAdReply fallback.
- Runtime telemetry tetap tersedia melalui runtime web.
