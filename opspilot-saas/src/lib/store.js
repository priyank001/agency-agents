import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { randomId } from './crypto.js';

const SCHEMA_VERSION = 1;

/**
 * Small document store: in-memory collections, optional JSON persistence with atomic
 * write-then-rename + fsync. Every read returns a deep copy so callers can't mutate state.
 * Org scoping is enforced through the `scope` argument ({ orgId }).
 */
export class Store {
  constructor({ dir = null, caps = {}, flushDelayMs = 50 } = {}) {
    this.dir = dir;
    this.caps = caps;
    this.flushDelayMs = flushDelayMs;
    this.collections = Object.create(null);
    this._timer = null;
    this._writing = Promise.resolve();
    this._dirty = false;
    if (dir) this._load();
  }

  get file() { return join(this.dir, 'opspilot.json'); }

  _load() {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.file)) return;
    const raw = readFileSync(this.file, 'utf8');
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data.collections !== 'object') throw new Error('bad shape');
      for (const [name, docs] of Object.entries(data.collections)) {
        if (Array.isArray(docs)) this.collections[name] = new Map(docs.map((d) => [d.id, d]));
      }
    } catch {
      // Never destroy data we cannot read: keep it aside for manual recovery.
      renameSync(this.file, `${this.file}.corrupt-${Date.now()}`);
    }
  }

  _col(name) {
    return (this.collections[name] ??= new Map());
  }

  _inScope(doc, scope) {
    if (!scope) return true;
    return Object.entries(scope).every(([k, v]) => doc[k] === v);
  }

  insert(name, doc) {
    const col = this._col(name);
    const record = structuredClone({ ...doc, id: doc.id || randomId(name), createdAt: doc.createdAt ?? Date.now() });
    col.set(record.id, record);
    const cap = this.caps[name];
    if (cap) while (col.size > cap) col.delete(col.keys().next().value);
    this._schedule();
    return structuredClone(record);
  }

  get(name, id, scope) {
    const doc = this._col(name).get(id);
    if (!doc || !this._inScope(doc, scope)) return null;
    return structuredClone(doc);
  }

  findOne(name, where) {
    for (const doc of this._col(name).values()) if (where(doc)) return structuredClone(doc);
    return null;
  }

  list(name, scope, { where, sort, limit } = {}) {
    let out = [];
    for (const doc of this._col(name).values()) {
      if (this._inScope(doc, scope) && (!where || where(doc))) out.push(doc);
    }
    if (sort) out.sort(sort);
    if (limit !== undefined) out = out.slice(0, limit);
    return structuredClone(out);
  }

  count(name, scope, where) {
    let n = 0;
    for (const doc of this._col(name).values()) if (this._inScope(doc, scope) && (!where || where(doc))) n++;
    return n;
  }

  update(name, id, patch, scope) {
    const col = this._col(name);
    const doc = col.get(id);
    if (!doc || !this._inScope(doc, scope)) return null;
    const { id: _i, orgId: _o, createdAt: _c, ...safe } = structuredClone(patch);
    const next = { ...doc, ...safe, updatedAt: Date.now() };
    col.set(id, next);
    this._schedule();
    return structuredClone(next);
  }

  remove(name, id, scope) {
    const col = this._col(name);
    const doc = col.get(id);
    if (!doc || !this._inScope(doc, scope)) return false;
    col.delete(id);
    this._schedule();
    return true;
  }

  removeWhere(name, where) {
    const col = this._col(name);
    let n = 0;
    for (const [id, doc] of col) if (where(doc)) { col.delete(id); n++; }
    if (n) this._schedule();
    return n;
  }

  _schedule() {
    if (!this.dir) return;
    this._dirty = true;
    if (this._timer) return;
    this._timer = setTimeout(() => { this._timer = null; this.flush(); }, this.flushDelayMs);
    this._timer.unref?.();
  }

  /** Serialized, atomic persistence. Safe to call concurrently. */
  flush() {
    if (!this.dir) return Promise.resolve();
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._writing = this._writing.then(() => {
      if (!this._dirty) return;
      this._dirty = false;
      const data = { version: SCHEMA_VERSION, savedAt: Date.now(), collections: {} };
      for (const [name, col] of Object.entries(this.collections)) data.collections[name] = [...col.values()];
      const tmp = `${this.file}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(data));
      const fd = openSync(tmp, 'r');
      try { fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(tmp, this.file);
    }).catch((err) => {
      this._dirty = true;
      console.error('[store] flush failed:', err.message);
    });
    return this._writing;
  }
}
