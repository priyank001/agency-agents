export class ValidationError extends Error {
  constructor(details, message = 'Some fields need attention') {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
// Reject C0 control chars except tab/newline (allowed only when multiline), and DEL.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function checkField(rule, value, field) {
  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') return [null, 'must be text'];
      const v = value.trim();
      if (CONTROL.test(v) || (!rule.multiline && /[\n\r\t]/.test(v))) return [null, 'contains invalid characters'];
      if (rule.min !== undefined && v.length < rule.min) return [null, `must be at least ${rule.min} characters`];
      if (v.length > (rule.max ?? 500)) return [null, `must be at most ${rule.max ?? 500} characters`];
      if (rule.pattern && !rule.pattern.test(v)) return [null, rule.patternMessage || 'has an invalid format'];
      return [v];
    }
    case 'password': {
      if (typeof value !== 'string') return [null, 'must be text'];
      if (value.length < (rule.min ?? 10)) return [null, `must be at least ${rule.min ?? 10} characters`];
      if (value.length > 200) return [null, 'must be at most 200 characters'];
      return [value];
    }
    case 'email': {
      if (typeof value !== 'string') return [null, 'must be an email address'];
      const v = value.trim().toLowerCase();
      if (v.length > 254 || !EMAIL.test(v) || CONTROL.test(v)) return [null, 'must be a valid email address'];
      return [v];
    }
    case 'int': {
      if (typeof value !== 'number' || !Number.isInteger(value)) return [null, 'must be a whole number'];
      if (rule.min !== undefined && value < rule.min) return [null, `must be ≥ ${rule.min}`];
      if (rule.max !== undefined && value > rule.max) return [null, `must be ≤ ${rule.max}`];
      return [value];
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return [null, 'must be a number'];
      if (rule.min !== undefined && value < rule.min) return [null, `must be ≥ ${rule.min}`];
      if (rule.max !== undefined && value > rule.max) return [null, `must be ≤ ${rule.max}`];
      return [value];
    }
    case 'bool':
      if (typeof value !== 'boolean') return [null, 'must be true or false'];
      return [value];
    case 'enum':
      if (!rule.values.includes(value)) return [null, `must be one of: ${rule.values.join(', ')}`];
      return [value];
    case 'url': {
      if (typeof value !== 'string' || value.length > (rule.max ?? 2048) || CONTROL.test(value) || /\s/.test(value.trim())) return [null, 'must be a valid URL'];
      const v = value.trim();
      // Allow scp-style git remotes: git@github.com:org/repo.git
      if (rule.allowScp && /^[\w.-]+@[\w.-]+:[\w./-]+$/.test(v)) return [v];
      let u;
      try { u = new URL(v); } catch { return [null, 'must be a valid URL']; }
      const protocols = rule.protocols || ['https:', 'http:'];
      if (!protocols.includes(u.protocol)) return [null, `must start with ${protocols.map((p) => p.replace(':', '')).join(' or ')}`];
      if (!u.hostname) return [null, 'must include a host name'];
      return [v];
    }
    case 'array': {
      if (!Array.isArray(value)) return [null, 'must be a list'];
      if (rule.max !== undefined && value.length > rule.max) return [null, `must have at most ${rule.max} items`];
      if (rule.min !== undefined && value.length < rule.min) return [null, `must have at least ${rule.min} items`];
      const out = [];
      for (let i = 0; i < value.length; i++) {
        const [v, err] = checkField(rule.of, value[i], `${field}[${i}]`);
        if (err) return [null, `item ${i + 1} ${err}`];
        out.push(v);
      }
      return [rule.unique ? [...new Set(out)] : out];
    }
    case 'object': {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return [null, 'must be an object'];
      return [value];
    }
    default:
      throw new Error(`Unknown rule type ${rule.type}`);
  }
}

/**
 * Validates `input` against `schema`. Returns a fresh plain object with only known keys.
 * Throws ValidationError listing every invalid field.
 */
export function validate(schema, input, { partial = false } = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError([{ field: '_body', message: 'Request body must be a JSON object' }]);
  }
  const out = {};
  const details = [];
  for (const [field, rule] of Object.entries(schema)) {
    if (FORBIDDEN_KEYS.has(field)) continue;
    const present = Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined && input[field] !== null && input[field] !== '';
    if (!present) {
      if (partial) continue;
      if (rule.required) details.push({ field, message: `${rule.label || field} is required` });
      else if (rule.default !== undefined) out[field] = structuredClone(rule.default);
      continue;
    }
    const [value, err] = checkField(rule, input[field], field);
    if (err) details.push({ field, message: `${rule.label || field} ${err}` });
    else out[field] = value;
  }
  if (details.length) throw new ValidationError(details);
  return out;
}
