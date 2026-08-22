// Minimal QR Code encoder (byte mode, low ECC, versions 1-10) — no external deps
const QR = (() => {
  const EC_LEVEL = 1, G18 = 0x1F25, G15 = 0x537, G15_MASK = 0x5412;
  const digit = (d) => { let n = 0; while (d !== 0) { n++; d >>>= 1; } return n; };
  const bchType = (data) => { let d = data << 10; while (digit(d) - digit(G15) >= 0) d ^= (G15 << (digit(d) - digit(G15))); return ((data << 10) | d) ^ G15_MASK; };
  const bchNum = (t) => { let d = t << 12; while (digit(d) - digit(G18) >= 0) d ^= (G18 << (digit(d) - digit(G18))); return (t << 12) | d; };
  const PATPOS = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54]];
  const EXP = new Array(256), LOG = new Array(256);
  for (let i = 0; i < 8; i++) EXP[i] = 1 << i;
  for (let i = 8; i < 256; i++) EXP[i] = EXP[i - 4] ^ EXP[i - 5] ^ EXP[i - 6] ^ EXP[i - 8];
  for (let i = 0; i < 255; i++) LOG[EXP[i]] = i;
  const glog = (n) => LOG[n], gexp = (n) => { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP[n]; };
  class Poly {
    constructor(num, shift) { let o = 0; while (o < num.length && num[o] === 0) o++; this.num = new Array(num.length - o + shift); for (let i = 0; i < num.length - o; i++) this.num[i] = num[i + o]; for (let i = 0; i < shift; i++) this.num[num.length - o + i] = 0; }
    get(i) { return this.num[i]; } len() { return this.num.length; }
    mul(e) { const n = new Array(this.len() + e.len() - 1).fill(0); for (let i = 0; i < this.len(); i++) for (let j = 0; j < e.len(); j++) n[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j))); return new Poly(n, 0); }
    mod(e) { if (this.len() - e.len() < 0) return this; const r = glog(this.get(0)) - glog(e.get(0)); const n = this.num.slice(); for (let i = 0; i < e.len(); i++) n[i] ^= gexp(glog(e.get(i)) + r); return new Poly(n, 0).mod(e); }
  }
  class Buf {
    constructor() { this.buffer = []; this.length = 0; }
    put(num, len) { for (let i = 0; i < len; i++) this.putBit(((num >>> (len - i - 1)) & 1) === 1); }
    putBit(bit) { const bi = Math.floor(this.length / 8); if (this.buffer.length <= bi) this.buffer.push(0); if (bit) this.buffer[bi] |= (0x80 >>> (this.length % 8)); this.length++; }
  }
  const RS_TABLE = { "1-1": [1, 26, 19], "2-1": [1, 44, 34], "3-1": [1, 70, 55], "4-1": [1, 100, 80], "5-1": [1, 134, 108], "6-1": [2, 86, 68], "7-1": [2, 98, 78], "8-1": [2, 121, 97], "9-1": [2, 146, 116], "10-1": [2, 86, 68] };
  function getMask(p, i, j) {
    switch (p) { case 0: return (i + j) % 2 === 0; case 1: return i % 2 === 0; case 2: return j % 3 === 0; case 3: return (i + j) % 3 === 0; case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; case 5: return (i * j) % 2 + (i * j) % 3 === 0; case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0; case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0; }
  }
  function lostPoint(qr) {
    const mc = qr.moduleCount; let lp = 0;
    for (let r = 0; r < mc; r++) for (let c = 0; c < mc; c++) { let same = 0; const dark = qr.isDark(r, c); for (let dr = -1; dr <= 1; dr++) { if (r + dr < 0 || mc <= r + dr) continue; for (let dc = -1; dc <= 1; dc++) { if (c + dc < 0 || mc <= c + dc) continue; if (dr === 0 && dc === 0) continue; if (dark === qr.isDark(r + dr, c + dc)) same++; } } if (same > 5) lp += 3 + same - 5; }
    let dark = 0; for (let r = 0; r < mc; r++) for (let c = 0; c < mc; c++) if (qr.isDark(r, c)) dark++;
    lp += Math.abs((100 * dark) / mc / mc - 50) / 5 * 10;
    return lp;
  }
  class QRCode {
    constructor(type) { this.type = type; this.modules = null; this.moduleCount = 0; this.dataList = []; }
    addData(str) { this.dataList.push(str); }
    isDark(r, c) { return this.modules[r][c]; }
    make() {
      this.moduleCount = this.type * 4 + 17;
      this.modules = Array.from({ length: this.moduleCount }, () => new Array(this.moduleCount).fill(null));
      this._pos(0, 0); this._pos(this.moduleCount - 7, 0); this._pos(0, this.moduleCount - 7);
      this._adjust(); this._timing();
      let best = 0, bestLp = Infinity;
      for (let m = 0; m < 8; m++) { this._info(m); this._timing(); const lp = lostPoint(this); if (lp < bestLp) { bestLp = lp; best = m; } }
      this._info(best);
      const data = QRCode.createBytes(this.dataList.join(""), this.type);
      this._map(data, best);
    }
    _pos(row, col) { for (let r = -1; r <= 7; r++) { if (row + r <= -1 || this.moduleCount <= row + r) continue; for (let c = -1; c <= 7; c++) { if (col + c <= -1 || this.moduleCount <= col + c) continue; this.modules[row + r][col + c] = (0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4); } } }
    _timing() { for (let r = 8; r < this.moduleCount - 8; r++) if (this.modules[r][6] == null) this.modules[r][6] = r % 2 === 0; for (let c = 8; c < this.moduleCount - 8; c++) if (this.modules[6][c] == null) this.modules[6][c] = c % 2 === 0; }
    _adjust() { const pos = PATPOS[this.type - 1] || []; for (const row of pos) for (const col of pos) { if (this.modules[row][col] != null) continue; for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) this.modules[row + r][col + c] = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)); } }
    _info(mask) { const data = (EC_LEVEL << 3) | mask; const bits = bchType(data); for (let i = 0; i < 15; i++) { const b = ((bits >> i) & 1) === 1; if (i < 6) this.modules[i][8] = b; else if (i < 8) this.modules[i + 1][8] = b; else this.modules[this.moduleCount - 15 + i][8] = b; } for (let i = 0; i < 15; i++) { const b = ((bits >> i) & 1) === 1; if (i < 8) this.modules[8][this.moduleCount - i - 1] = b; else if (i < 9) this.modules[8][15 - i] = b; else this.modules[8][15 - i - 1] = b; } this.modules[this.moduleCount - 8][8] = true; }
    _map(data, mask) { let inc = -1, row = this.moduleCount - 1, bit = 7, byte = 0; for (let col = this.moduleCount - 1; col > 0; col -= 2) { if (col === 6) col--; while (true) { for (let c = 0; c < 2; c++) { if (this.modules[row][col - c] == null) { let dark = false; if (byte < data.length) dark = ((data[byte] >>> bit) & 1) === 1; if (getMask(mask, row, col - c)) dark = !dark; this.modules[row][col - c] = dark; bit--; if (bit === -1) { byte++; bit = 7; } } } row += inc; if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break; } } } }
    static createBytes(str, type) {
      const rsRow = RS_TABLE[type + "-1"] || RS_TABLE["10-1"]; const [count, total, dcCount] = rsRow;
      const buf = new Buf(); buf.put(4, 4); buf.put(str.length, 8);
      for (let i = 0; i < str.length; i++) buf.put(str.charCodeAt(i), 8);
      const totalData = dcCount * count;
      if (buf.length + 4 <= totalData * 8) buf.put(0, 4);
      while (buf.length % 8 !== 0) buf.putBit(false);
      while (buf.length < totalData * 8) { buf.put(0xEC, 8); if (buf.length >= totalData * 8) break; buf.put(0x11, 8); }
      const dc = new Array(count), ec = new Array(count); let off = 0, maxEc = 0;
      for (let r = 0; r < count; r++) { dc[r] = new Array(dcCount); for (let i = 0; i < dcCount; i++) dc[r][i] = 0xff & (buf.buffer[i + off] || 0); off += dcCount; const ecCount = total - dcCount; maxEc = Math.max(maxEc, ecCount); let rsPoly = new Poly([1], 0); for (let i = 0; i < ecCount; i++) rsPoly = rsPoly.mul(new Poly([1, gexp(i)], 0)); const raw = new Poly(dc[r], rsPoly.len() - 1); const mod = raw.mod(rsPoly); ec[r] = new Array(ecCount); for (let i = 0; i < ec[r].length; i++) { const mi = i + mod.len() - ec[r].length; ec[r][i] = mi >= 0 ? mod.get(mi) : 0; } }
      const totalCode = count * total; const out = new Array(totalCode); let idx = 0;
      for (let i = 0; i < dcCount; i++) for (let r = 0; r < count; r++) out[idx++] = dc[r][i];
      for (let i = 0; i < maxEc; i++) for (let r = 0; r < count; r++) if (i < ec[r].length) out[idx++] = ec[r][i];
      return out;
    }
  }
  function pickType(len) { const cap = [17, 32, 53, 78, 106, 134, 154, 192, 230, 271]; for (let v = 1; v <= 10; v++) if (len <= cap[v - 1]) return v; return 10; }
  return { generate(text) { const qr = new QRCode(pickType(text.length)); qr.addData(text); qr.make(); return qr; } };
})();

export function QRCodeSVG({ value, size = 140, fg = "#0A0C18", bg = "#ffffff" }) {
  const qr = QR.generate(value);
  const count = qr.moduleCount;
  const cell = size / count;
  let path = "";
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${(c * cell).toFixed(2)},${(r * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z `;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", borderRadius: 6 }}>
      <rect width={size} height={size} fill={bg} /><path d={path} fill={fg} />
    </svg>
  );
}
