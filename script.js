"use strict";
/* ============================================================
   PÁC BÓ 1941 – BẢO VỆ CĂN CỨ (CUSTOM AUDIO UPDATE)
============================================================ */

/* ==================== ẢNH NHÂN VẬT & BẢN ĐỒ ==================== */
const SPRITES = {
  map_day:   "Map/Map_Sang.png", 
  map_dusk:  "Map/Map_Chieu.png", 
  map_night: "Map/Map_Toi.png", 
  rifle:   "Nhân Vật/Lính Việt Minh.png", 
  grenade: "Nhân Vật/Du kích.png", 
  sniper:  "Nhân Vật/Lính Bắn Tỉa.png", 
  mg:      "Nhân Vật/Súng Máy.png", 
  support: "Nhân Vật/Giao Liên.png", 
  trap:    "Nhân Vật/Bẫy.png", 
  french:   "Nhân Vật/Linh_Phap.png",
  japanese: "Nhân Vật/Linh_Nhat.png",
  scout:    "Nhân Vật/Scout.png",
  officer:  "Nhân Vật/SI_Quan.png",
  armored:  "Nhân Vật/Linh_Tank.png",
  tank:     "Nhân Vật/Xe_Tang.png",
};

const SPRITE_DIR = {
  rifle:   "right", grenade: "right", sniper:  "right", mg:      "right",
  support: "right", trap:    "top",   french:  "right", japanese:"right",
  scout:   "right", officer: "right", armored: "right", tank:    "right",
};

const SPRITE_IMGS = {}; 
function loadSprites(){
  for (const k in SPRITES){
    if (!SPRITES[k]) continue;
    const img = new Image();
    img.src = SPRITES[k].startsWith("data:") ? SPRITES[k] : encodeURI(SPRITES[k]);
    SPRITE_IMGS[k] = img;
  }
}
loadSprites();

/* ==================== CẤU HÌNH ÂM THANH TỰ CHỌN ==================== */
// HƯỚNG DẪN: Đặt các file âm thanh của bạn vào thư mục "Âm thanh/".
// Sau đó điền tên file (kèm đuôi .mp3 hoặc .wav) vào các ô dưới đây.
// Nếu để trống "", game sẽ không phát âm thanh đó.
const SOUNDS = {
  // 1. Âm thanh môi trường (Ambient)
  ambient_day:   "Âm thanh môi trường/Tieng_suoi.mp3",      // Tiếng suối chảy / chim hót (ban ngày)
  ambient_night: "Âm thanh môi trường/De_men.mp3",         // Tiếng dế mèn / gió hú (ban đêm)
  ambient_rain:  "Âm thanh môi trường/Mua.mp3",        // Tiếng mưa rơi
  
  // 2. Tiếng súng của từng nhân vật
  shoot_rifle:   "Âm thanh nhân vật/Sung_truong.mp3",    // Chiến sĩ
  shoot_grenade: {src: "Âm thanh nhân vật/Luu_dan.mp3", volume: 0.3},     // Du kích
  shoot_sniper:  {src: "Âm thanh nhân vật/Sung_tia.mp3", volume: 0.1},   // Bắn tỉa
  shoot_mg:      "Âm thanh nhân vật/Sung_truong.mp3",       // Súng máy
  
  // 3. Hiệu ứng khác
  sfx_explode:   "Âm thanh nhân vật/Luu_dan.mp3",         // Tiếng nổ (xe tăng, đạn pháo)
  sfx_place:     "Âm thanh khác/Dat_quan.mp3",       // Tiếng đặt quân
  sfx_upgrade:   "Âm thanh khác/Tang_cap.mp3",       // Tiếng nâng cấp
  sfx_sell:      "Âm thanh khác/Ban_quan.mp3",       // Tiếng bán quân
  sfx_alarm:     "Âm thanh khác/Bao_dong.m4a",   // Còi báo động đánh Boss
  sfx_win:       "Âm thanh khác/Win.mp3",    // Tiếng thắng
  sfx_lose:      "Âm thanh khác/Lose.mp3",       // Tiếng thua
};

// Hệ thống quản lý âm thanh
const AudioSys = (() => {
  let musicOn = true;
  let bgMusic = new Audio("Nhạc/Nhạc V1.mp3");
  bgMusic.loop = true; bgMusic.volume = 0.2;
  
  // Lưu trữ các đối tượng âm thanh
  let sfxPool = {};
  let ambientAudio = null;
  let currentAmbient = "";

  // Khởi tạo trước các âm thanh (Preload)
  function init() {
    for (let key in SOUNDS) {
      if (SOUNDS[key]) {
        // Nếu là chuỗi (string) -> dùng mặc định 0.5
        if (typeof SOUNDS[key] === "string") {
          sfxPool[key] = { audio: new Audio(SOUNDS[key]), vol: 0.5 };
        } 
        // Nếu là object {src, volume} -> lấy volume do bạn chỉnh
        else {
          sfxPool[key] = { 
            audio: new Audio(SOUNDS[key].src), 
            vol: SOUNDS[key].volume !== undefined ? SOUNDS[key].volume : 0.5 
          };
        }
      }
    }
  }
  
  function resume() {
    // Trình duyệt yêu cầu tương tác trước khi phát âm thanh
    if (bgMusic.paused && musicOn) bgMusic.play().catch(()=>{});
  }

     function playSFX(key) {
    if (sfxPool[key]) {
      const clone = sfxPool[key].audio.cloneNode();
      clone.volume = sfxPool[key].vol; // Lấy âm lượng từ cấu hình
      clone.play().catch(()=>{});
    }
  }

  function setAmbient(type) {
    if (currentAmbient === type) return;
    currentAmbient = type;

    // Dừng âm thanh môi trường cũ
    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio = null;
    }

    // Phát âm thanh môi trường mới
    if (type === "day" && SOUNDS.ambient_day) {
      ambientAudio = new Audio(SOUNDS.ambient_day);
      ambientAudio.loop = true; ambientAudio.volume = 0.4;
      ambientAudio.play().catch(()=>{});
    } else if (type === "night" && SOUNDS.ambient_night) {
      ambientAudio = new Audio(SOUNDS.ambient_night);
      ambientAudio.loop = true; ambientAudio.volume = 0.4;
      ambientAudio.play().catch(()=>{});
    } else if (type === "rain" && SOUNDS.ambient_rain) {
      ambientAudio = new Audio(SOUNDS.ambient_rain);
      ambientAudio.loop = true; ambientAudio.volume = 0.4;
      ambientAudio.play().catch(()=>{});
    }
  }

  return {
    init, resume, playSFX, setAmbient,
    get musicOn(){ return musicOn; },
    toggleMusic(){ 
      musicOn = !musicOn; 
      if (musicOn) { if(bgMusic) bgMusic.play().catch(()=>{}); } 
      else { if(bgMusic) bgMusic.pause(); } 
      return musicOn; 
    },
    startMusicLoop(){ if (musicOn && bgMusic) bgMusic.play().catch(()=>{}); },
    stopMusicLoop(){ if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; } },
    
    // Hàm rỗng để tương thích với code cũ
    toggleSfx(){ return true; } 
  };
})();

/* ==================== CONFIG ==================== */
const CONFIG = {
  startFood: 150, prepTime: 15,
  waveClearBase: 40, waveClearPerWave: 10,
  sellRatio: 0.6, upgradeCostRatio: [0, 0.7, 1.0],
  upgradeDmgMul: 1.3, upgradeRangeMul: 1.1,
  stunDurationTank: 5, stunDurationSupport: 2,
  maxParticles: 300, maxDt: 0.05,
  trapDamage: 40, trapSlow: 0.4, trapSlowDur: 2,
  trapUses: 3, maxTraps: 4, trapPrice: 40,
  bossWarnDelay: 8,
  safetyEasy: 20, 
  safetyEndless: 10,
};

/* ==================== ĐỊNH NGHĨA QUÂN TA ==================== */
const TOWER_DEFS = {
  rifle: { name: "Chiến sĩ Việt Minh", short: "Chiến sĩ", icon: "🔫", color: "#6b8e3a",
    price: 50, damage: 12, fireRate: 1.0, range: 150, bulletSpeed: 620, desc: "Súng trường. Cân bằng." },
  grenade: { name: "Du kích lựu đạn", short: "Du kích", icon: "💣", color: "#8a5a2b",
    price: 80, damage: 25, fireRate: 2.0, range: 130, bulletSpeed: 420, splash: 45, desc: "Nổ lan 45px." },
  sniper: { name: "Xạ thủ bắn tỉa", short: "Bắn tỉa", icon: "🎯", color: "#4a6b5a",
    price: 120, damage: 45, fireRate: 2.2, range: 260, bulletSpeed: 1000, priorityHighHp: true, tankBonus: 1.5, desc: "Tầm xa, x1.5 lên xe tăng." },
  mg: { name: "Xạ thủ súng máy", short: "Súng máy", icon: "🌀", color: "#5a5a6b",
    price: 200, damage: 7, fireRate: 0.15, range: 170, bulletSpeed: 700, heatMax: 4.0, cooldown: 1.5, desc: "Bắn cực nhanh, dễ quá nhiệt." },
  support: { name: "Nữ giao liên", short: "Giao liên", icon: "🚩", color: "#b03a5b",
    price: 70, damage: 0, fireRate: 0, range: 280, buffRates: [0.15, 0.25, 0.35], desc: "Tăng tốc bắn quanh." },
  trap: { name: "Bẫy chông tre", short: "Chông tre", icon: "🎋", color: "#7a6b2b",
    price: 40, damage: 40, fireRate: 0, range: 0, desc: "Đặt trên đường, 3 lượt." },
};
const TOWER_ORDER = ["rifle","grenade","sniper","mg","support","trap"];

/* ==================== ĐỊNH NGHĨA ĐỊCH ==================== */
const ENEMY_DEFS = {
  french: { name: "Lính Pháp", short: "Lính Pháp", hp_easy: 40, hp_hard: 60, speed: 55, reward: 10, armor: 0, r: 13, safetyCost: 1 },
  japanese: { name: "Lính Nhật", short: "Lính Nhật", hp_easy: 90, hp_hard: 130, speed: 45, reward: 18, armor: 0, r: 14, safetyCost: 1 },
  scout: { name: "Trinh sát", short: "Trinh sát", hp_easy: 35, hp_hard: 50, speed: 120, reward: 14, armor: 0, r: 12, safetyCost: 1 },
  officer: { name: "Sĩ quan", short: "Sĩ quan", hp_easy: 100, hp_hard: 150, speed: 50, reward: 30, armor: 0, r: 15, aura: { radius: 100, speedMul: 1.2 }, safetyCost: 5 }, 
  armored: { name: "Bọc thép", short: "Bọc thép", hp_easy: 300, hp_hard: 450, speed: 40, reward: 60, armor: 3, r: 20, safetyCost: 5 }, 
  tank: { name: "XE TĂNG", short: "Xe tăng", hp_easy: 1800, hp_hard: 2500, speed: 28, reward: 200, armor: 5, r: 30, cannonRange: 220, cannonCd: 3.5, cannonCdEnraged: 2.5, cannonSplash: 50, boss: true, safetyCost: 5 },
};

/* ==================== WAVES ==================== */
const WAVES = [
  [ {type:"french", count:8, gap:1.1} ],
  [ {type:"french", count:10, gap:1.0}, {type:"scout", count:3, gap:0.7} ],
  [ {type:"french", count:8, gap:1.0}, {type:"japanese", count:4, gap:1.4} ],
  [ {type:"scout", count:6, gap:0.6}, {type:"japanese", count:6, gap:1.3} ],
  [ {type:"french", count:10, gap:0.9}, {type:"japanese", count:5, gap:1.3}, {type:"officer", count:1, gap:2.0} ],
  [ {type:"japanese", count:8, gap:1.1}, {type:"scout", count:8, gap:0.55}, {type:"officer", count:2, gap:2.0} ],
  [ {type:"armored", count:1, gap:2.0}, {type:"french", count:10, gap:0.85}, {type:"japanese", count:6, gap:1.2} ],
  [ {type:"armored", count:2, gap:2.2}, {type:"japanese", count:12, gap:1.0}, {type:"officer", count:3, gap:1.8} ],
  [ {type:"armored", count:3, gap:2.0}, {type:"scout", count:10, gap:0.5}, {type:"officer", count:4, gap:1.6}, {type:"japanese", count:10, gap:1.0} ],
  [ {type:"japanese", count:8, gap:1.0}, {type:"officer", count:3, gap:1.8}, {type:"tank", count:1, gap:0, delay:CONFIG.bossWarnDelay} ],
];

/* ==================== TIỆN ÍCH & ĐƯỜNG ĐI ==================== */
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const dist2 = (ax,ay,bx,by)=>{ const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; };
const lerp = (a,b,t)=>a+(b-a)*t;

const MAP_W = 1600, MAP_H = 900;
const PATH_WPTS = [
  {x:28, y:343}, {x:523, y:354}, {x:607, y:418}, {x:630, y:602},
  {x:924, y:601}, {x:1143, y:431}, {x:1330, y:501}, {x:1593, y:501},
];
const PATH_SEGS = [];
let PATH_TOTAL = 0;
(function buildPath(){
  for (let i=0;i<PATH_WPTS.length-1;i++){
    const a = PATH_WPTS[i], b = PATH_WPTS[i+1];
    const len = Math.hypot(b.x-a.x, b.y-a.y);
    PATH_SEGS.push({a,b,len,start:PATH_TOTAL});
    PATH_TOTAL += len;
  }
})();
function pointAtDist(d){
  d = clamp(d, 0, PATH_TOTAL);
  for (let i=0;i<PATH_SEGS.length;i++){
    const s = PATH_SEGS[i];
    if (d <= s.start + s.len || i === PATH_SEGS.length-1){
      const t = s.len > 0 ? (d - s.start)/s.len : 0;
      return { x: lerp(s.a.x, s.b.x, t), y: lerp(s.a.y, s.b.y, t), ang: Math.atan2(s.b.y-s.a.y, s.b.x-s.a.x) };
    }
  }
  return { x: PATH_WPTS[PATH_WPTS.length-1].x, y: PATH_WPTS[PATH_WPTS.length-1].y, ang: 0 };
}

function generateSlots(){
  const marks = [
    {x:435, y:281}, {x:750, y:379}, {x:972, y:397},
    {x:280, y:428}, {x:473, y:519}, {x:1269, y:351},
    {x:1157, y:534}, {x:1434, y:397}, {x:818, y:698},
    {x:1038, y:636}, {x:1348, y:598}, {x:725, y:530},
  ];
  return marks.map(m => ({ x:m.x, y:m.y, tower:null }));
}
function generateTrapSpots(){
  const spots = [];
  const n = CONFIG.maxTraps;
  for (let i=1;i<=n;i++){
    const d = PATH_TOTAL * (i/(n+1));
    const p = pointAtDist(d);
    spots.push({ x:p.x, y:p.y, dAlong:d, trap:null });
  }
  return spots;
}

/* ==================== CLASS TOWER ==================== */
class Tower {
  constructor(defKey, x, y, slot){
    this.defKey = defKey; this.def = TOWER_DEFS[defKey];
    this.x = x; this.y = y; this.slot = slot;
    this.level = 1; this.invested = this.def.price;
    this.angle = -Math.PI/2; this.cd = 0; this.recoil = 0;
    this.heat = 0; this.overheat = false; this.stunTimer = 0;
    this.buffRate = 0; this.stunResist = false; this.muzzleFlash = 0;
    this.spin = Math.random()*Math.PI*2; this.animT = Math.random()*10;
  }
  get damage(){ return this.def.damage * Math.pow(CONFIG.upgradeDmgMul, this.level-1); }
  get range(){ return this.def.range * Math.pow(CONFIG.upgradeRangeMul, this.level-1); }
  get fireInterval(){ return this.def.fireRate; }
  get upgradeCost(){ return this.level >= 3 ? null : Math.round(this.def.price * CONFIG.upgradeCostRatio[this.level]); }
  get sellValue(){ return Math.round(this.invested * CONFIG.sellRatio); }

  update(dt, game){
    this.animT += dt; this.spin += dt * (this.defKey === "mg" ? 3 : 0.5);
    if (this.stunTimer > 0){ this.stunTimer -= dt; return; }
    this.recoil = Math.max(0, this.recoil - dt*8);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt*6);
    if (this.defKey === "support" || this.defKey === "trap") return;

    if (this.defKey === "mg"){
      if (this.overheat){
        this.heat -= dt * 1.5;
        if (this.heat <= 0){ this.heat = 0; this.overheat = false; }
        return; 
      } else {
        this.heat = Math.max(0, this.heat - dt * 0.8); 
      }
    }

    this.cd -= dt; if (this.cd > 0) return;
    const target = this.findTarget(game); if (!target) return;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.fire(target, game);
  }
  findTarget(game){
    const r2 = this.range * this.range;
    let best = null, bestVal = -Infinity;
    for (const e of game.enemies){
      if (e.dead || dist2(this.x, this.y, e.x, e.y) > r2) continue;
      const val = this.def.priorityHighHp ? e.hp : e.distAlong;
      if (val > bestVal){ bestVal = val; best = e; }
    }
    return best;
  }
  fire(target, game){
    const interval = this.fireInterval / (1 + this.buffRate);
    this.cd = interval; this.recoil = 1; this.muzzleFlash = 1;
    let dmg = this.damage;
    if (this.defKey === "sniper" && target.isTank) dmg *= this.def.tankBonus;
    if (this.defKey === "grenade" && target.isTank) dmg *= 1.2;
    
    // PHÁT ÂM THANH SÚNG THEO TỪNG NHÂN VẬT
    if (this.defKey === "mg") AudioSys.playSFX("shoot_mg");
    else if (this.defKey === "sniper") AudioSys.playSFX("shoot_sniper");
    else if (this.defKey === "grenade") AudioSys.playSFX("shoot_grenade");
    else AudioSys.playSFX("shoot_rifle");
    
    const ang = Math.atan2(target.y - this.y, target.x - this.x);
    const muzzleX = this.x + Math.cos(ang)*20, muzzleY = this.y + Math.sin(ang)*20;
    game.projectiles.push(new Projectile({
      x:muzzleX, y:muzzleY, target, speed:this.def.bulletSpeed, damage:dmg,
      splash:this.def.splash || 0, color: this.defKey === "grenade" ? "#ffb84d" : "#ffe9a0",
      size: this.defKey === "grenade" ? 5 : 3, isGrenade: this.defKey === "grenade", owner:this, game,
    }));
    game.spawnMuzzle(muzzleX, muzzleY, ang);
    if (Math.random() < 0.5) game.spawnCasing(this.x, this.y, ang);
  }
}

/* ==================== CLASS ENEMY ==================== */
class Enemy {
  constructor(defKey, game, startDist=0){
    this.defKey = defKey; this.def = ENEMY_DEFS[defKey]; this.game = game;
    
    let hpMultiplier = 1;
    if (game.mode === "endless") hpMultiplier = Math.pow(1.15, game.waveIndex);
    
    this.maxHp = (game.mode === "easy") ? this.def.hp_easy : this.def.hp_hard;
    this.maxHp = Math.floor(this.maxHp * hpMultiplier);
    this.hp = this.maxHp;
    
    this.distAlong = startDist; this.baseSpeed = this.def.speed;
    this.dead = false; this.reachedBase = false;
    this.x = 0; this.y = 0; this.angle = 0;
    this.slowTimer = 0; this.slowFactor = 0; this.hitFlash = 0; this.animT = Math.random()*10;
    this.isTank = this.defKey === "tank"; this.tankPhase = 0;
    this.cannonCd = this.def.cannonCd || 0; this.officerBoost = 1;
    this.aura = this.def.aura || null;
    this.updatePos();
  }
  updatePos(){ const p = pointAtDist(this.distAlong); this.x=p.x; this.y=p.y; this.angle=p.ang; }
  get speed(){
    let s = this.baseSpeed;
    if (this.slowTimer > 0) s *= (1 - this.slowFactor);
    if (this.officerBoost > 1) s *= this.officerBoost;
    if (this.isTank && this.tankPhase === 2) s *= 1.25;
    return s;
  }
  update(dt, game){
    this.animT += dt; if (this.dead) return;
    this.hitFlash = Math.max(0, this.hitFlash - dt*5);
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.isTank){
      if (this.hp <= this.maxHp*0.5 && this.tankPhase < 1) this.tankPhase = 1;
      if (this.hp <= this.maxHp*0.25 && this.tankPhase < 2) this.tankPhase = 2;
      this.cannonCd -= dt;
      if (this.cannonCd <= 0){ this.fireCannon(game); this.cannonCd = (this.tankPhase >= 1 ? this.def.cannonCdEnraged : this.def.cannonCd); }
    }
    this.distAlong += this.speed * dt; this.updatePos();
    if (this.distAlong >= PATH_TOTAL - 10){
      this.reachedBase = true; this.dead = true; game.onEnemyReachedBase(this);
    }
  }
  fireCannon(game){
    let best = null, bestD = Infinity;
    for (const t of game.towers){
      if (t.stunTimer > 0 || t.defKey === "trap") continue;
      const d = dist2(this.x, this.y, t.x, t.y);
      if (d < this.def.cannonRange*this.def.cannonRange && d < bestD){ bestD = d; best = t; }
    }
    if (best){ game.spawnShell(this.x, this.y, best, this.def.cannonSplash, game); AudioSys.playSFX("sfx_explode"); }
  }
  takeDamage(dmg, game, source){
    if (this.dead) return;
    let actual = this.def.armor ? Math.max(1, dmg - this.def.armor) : dmg;
    this.hp -= actual; this.hitFlash = 1;
    game.spawnDamageText(this.x, this.y - this.def.r - 8, Math.round(actual));
    if (this.hp <= 0) this.die(game, source);
  }
  die(game, source){
    if (this.dead) return;
    this.dead = true; this.hp = 0; game.onEnemyKilled(this);
    if (this.isTank) game.onBossKilled(this);
  }
}

/* ==================== CLASS PROJECTILE & PARTICLE & SHELL ==================== */
class Projectile {
  constructor(opts){
    this.x = opts.x; this.y = opts.y; this.target = opts.target; this.speed = opts.speed;
    this.damage = opts.damage; this.splash = opts.splash || 0;
    this.color = opts.color || "#ffe9a0"; this.size = opts.size || 3; this.isGrenade = opts.isGrenade || false;
    this.dead = false; this.owner = opts.owner; this.trail = []; this.trailT = 0;
  }
  update(dt, game){
    if (this.dead) return;
    if (!this.target || this.target.dead){ this.dead = true; return; }
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy), step = this.speed * dt;
    if (d <= step + 4){ this.hit(game); this.dead = true; return; }
    this.x += dx/d * step; this.y += dy/d * step;
    this.trailT += dt;
    if (this.trailT > 0.03){
      this.trailT = 0; this.trail.push({x:this.x, y:this.y, life:0.15});
      if (this.trail.length > 8) this.trail.shift();
    }
    for (const tr of this.trail) tr.life -= dt;
    this.trail = this.trail.filter(t=>t.life>0);
  }
  hit(game){
    if (this.splash > 0){
      game.spawnExplosion(this.x, this.y, this.splash, this.isGrenade);
      AudioSys.playSFX("sfx_explode");
      const r2 = this.splash*this.splash;
      for (const e of game.enemies){
        if (!e.dead && dist2(this.x, this.y, e.x, e.y) <= r2) {
          let dmg = this.damage;
          if (e.isTank && this.owner && this.owner.defKey === "grenade") dmg *= 1.2;
          e.takeDamage(dmg, game, this.owner);
        }
      }
      game.shakeScreen(5);
    } else if (this.target && !this.target.dead) {
      this.target.takeDamage(this.damage, game, this.owner);
    }
  }
}
class Particle {
  constructor(opts){
    this.x = opts.x; this.y = opts.y; this.vx = opts.vx || 0; this.vy = opts.vy || 0;
    this.life = opts.life || 0.5; this.maxLife = this.life; this.size = opts.size || 3;
    this.color = opts.color || "#fff"; this.gravity = opts.gravity || 0;
    this.shrink = opts.shrink !== false; this.dead = false; this.type = opts.type || "dot";
  }
  update(dt){
    this.x += this.vx*dt; this.y += this.vy*dt;
    this.vy += this.gravity*dt; this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
}
class Shell {
  constructor(opts){
    this.x = opts.x; this.y = opts.y; this.sx = opts.x; this.sy = opts.y;
    this.tx = opts.tx; this.ty = opts.ty; this.t = 0; this.dur = opts.dur || 0.8;
    this.splash = opts.splash || 50; this.dead = false; this.game = opts.game; this.arc = 90;
  }
  update(dt){
    if (this.dead) return;
    this.t += dt; const k = clamp(this.t/this.dur, 0, 1);
    this.x = lerp(this.sx, this.tx, k); this.y = lerp(this.sy, this.ty, k) - Math.sin(k*Math.PI)*this.arc;
    if (k >= 1){ this.explode(); this.dead = true; }
  }
  explode(){
    const g = this.game;
    g.spawnExplosion(this.x, this.y, this.splash, true);
    AudioSys.playSFX("sfx_explode"); g.shakeScreen(9);
    const r2 = this.splash*this.splash;
    for (const t of g.towers){
      if (t.stunTimer > 0 || t.defKey === "trap") continue;
      if (dist2(this.x, this.y, t.x, t.y) <= r2){
        let stun = CONFIG.stunDurationTank;
        if (t.stunResist) stun = CONFIG.stunDurationSupport;
        t.stunTimer = stun;
      }
    }
  }
}

/* ==================== CLASS GAME ==================== */
class Game {
  constructor(canvas){
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.dpr = 1; this.scale = 1; this.offX = 0; this.offY = 0;
    this.state = "MENU";
    this.mode = "hard"; 
    
    this.slots = generateSlots(); this.trapSpots = generateTrapSpots();
    this.towers = []; this.traps = []; this.enemies = []; this.projectiles = [];
    this.particles = []; this.shells = []; this.damageTexts = []; 
    
    this.birds = []; for (let i=0;i<5;i++) this.birds.push({x:Math.random()*MAP_W, y:80+Math.random()*140, sp:20+Math.random()*25, ph:Math.random()*10});
    this.fireflies = []; for (let i=0;i<20;i++) this.fireflies.push({x:Math.random()*MAP_W, y:Math.random()*MAP_H, t:Math.random()*10, sp:0.5+Math.random()});

    this.rainParticles = [];
    this.fogLayers = [];
    for (let i=0;i<5;i++) {
      this.fogLayers.push({ x: Math.random()*MAP_W, y: 200 + Math.random()*600, speed: 10+Math.random()*15, size: 200+Math.random()*100, alpha: 0.05+Math.random()*0.05 });
    }

    this.isDragging = false; this.dragKey = null; this.dragX = 0; this.dragY = 0; this.hoveredSlot = null;

    this.lastTime = 0; this.rafId = null; this._loop = this._loop.bind(this);
    this.resize();
    window.addEventListener("resize", ()=>this.resize());
    window.addEventListener("orientationchange", ()=>setTimeout(()=>this.resize(), 200));
     if (screen.orientation) {
      screen.orientation.addEventListener("change", () => {
        setTimeout(() => this.resize(), 200);
      });
    }
    document.addEventListener("visibilitychange", ()=>{ if (document.hidden && (this.state === "PREP" || this.state === "WAVE")) this.pauseGame(); });
    
    this.state = "MENU";
    this.mode = "hard"; 
    
    // THÊM DÒNG NÀY ĐỂ NHẬN DIỆN ĐIỆN THOẠI
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.slots = generateSlots(); 
    this._bindInput();
    this.buildTowerBar();
    this.reset(); 
  }

  reset(){
    this.food = CONFIG.startFood;
    
    const safetyWrap = document.getElementById("safetyBarWrap");
    if (this.mode === "easy") {
      this.safety = CONFIG.safetyEasy;
      if (safetyWrap) safetyWrap.style.display = "block";
    } else if (this.mode === "endless") {
      this.safety = CONFIG.safetyEndless;
      if (safetyWrap) safetyWrap.style.display = "block";
    } else {
      this.safety = 0;
      if (safetyWrap) safetyWrap.style.display = "none";
    }

    this.waveIndex = 0; this.kills = 0; this.speedMul = 1;
    
    const btnSpeed = document.getElementById("btnSpeed");
    if (btnSpeed) {
      btnSpeed.textContent = "x1";
      btnSpeed.classList.remove("on");
    }
    
    this.slots = generateSlots(); this.trapSpots = generateTrapSpots();
    this.towers = []; this.traps = []; this.enemies = []; this.projectiles = [];
    this.particles = []; this.shells = []; this.damageTexts = [];
    this.rainParticles = [];
    this.boss = null; this.bossSpawned = false;
    this.selectedTower = null; this.selectedSlot = null; this.selectedBuildKey = null;
    this.hideActionPanel(); this.updatePlaceHint(); this.clearSlotHighlights();
    
    this.prepTimer = CONFIG.prepTime; this.lastCountdown = null;
    this.spawnQueue = []; this.waveActive = false;
    this.screenShake = 0; this.flashRed = 0; this.slowMoTimer = 0;
    this.lightningTimer = 0;
    
    this.timeOfDay = "day"; this.prevTimeOfDay = "day"; this.bgAlpha = 1; 
    this.totalGameTime = 0;
    
    this.isDragging = false; this.dragKey = null; this.hoveredSlot = null;
    if(this.canvas) this.canvas.style.cursor = "default";
    
    AudioSys.setAmbient("day");

    const bossWrap = document.getElementById("bossBarWrap");
    if (bossWrap) bossWrap.classList.remove("show");
    
    const redFlash = document.getElementById("redFlash");
    if (redFlash) redFlash.classList.remove("on");
    
    const timeTxt = document.getElementById("timeTxt");
    if (timeTxt) timeTxt.textContent = "00:00";

    this.updateHUD(); 
    this.refreshTowerBar();
  }

  buildTowerBar(){
    const bar = document.getElementById("towerBar"); bar.innerHTML = "";
    TOWER_ORDER.forEach((key, idx)=>{
      const def = TOWER_DEFS[key];
      const card = document.createElement("div");
      card.className = "tCard"; card.dataset.key = key;
      const hasImg = SPRITES[key];
      const iconHtml = hasImg ? `<img src="${SPRITES[key]}" style="width:40px; height:40px; object-fit:contain; margin-top:2px; pointer-events:none;" />` : `<span class="tIcon" style="pointer-events:none;">${def.icon}</span>`;
      card.innerHTML = `<span class="keyHint">${idx+1}</span>${iconHtml}<span class="tName" style="pointer-events:none;">${def.short}</span><span class="tCost" style="pointer-events:none;">${def.price}💰</span>`;
      
      card.addEventListener("pointerenter", (ev)=>{
        this.showStatsPanel(key);
      });
      card.addEventListener("pointerleave", ()=>{
        this.hideStatsPanel();
      });

      let startX = 0, startY = 0, hasDragged = false;
      let tempDragging = false;

      card.addEventListener("pointerdown", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        AudioSys.init(); AudioSys.resume();
        if (this.food < def.price) { this.toast("Không đủ lương thực!"); return; }
        startX = ev.clientX; startY = ev.clientY;
        hasDragged = false; tempDragging = true;
      });

      card.addEventListener("pointermove", (ev) => {
        if (!tempDragging) return;
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 10) {
          hasDragged = true; tempDragging = false; 
          this.isDragging = true; this.dragKey = key;
          this.canvas.style.cursor = "grabbing";
          this.selectedBuildKey = null;
          this.refreshTowerBar(); this.updatePlaceHint(); this.clearSlotHighlights(); this.hideTooltip();
        }
      });

      card.addEventListener("pointerup", () => {
        if (tempDragging && !hasDragged) this.selectBuildKey(key);
        tempDragging = false;
      });
      
      card.addEventListener("pointercancel", () => { tempDragging = false; });
      
      bar.appendChild(card);
    });
  }
  
  showStatsPanel(key) {
    this.hideTooltip(); 
    const def = TOWER_DEFS[key];
    const panel = document.getElementById("towerStatsPanel");
    if (!panel) return;
    document.getElementById("tsName").textContent = def.name;
    document.getElementById("tsDmg").textContent = def.damage > 0 ? def.damage : "0";
    document.getElementById("tsRange").textContent = def.range > 0 ? def.range : "0";
    document.getElementById("tsSpeed").textContent = def.fireRate > 0 ? def.fireRate : "0";
    document.getElementById("tsDesc").textContent = def.desc;
    panel.classList.add("show");
  }
  
  hideStatsPanel() {
    const panel = document.getElementById("towerStatsPanel");
    if (panel) panel.classList.remove("show");
  }

  refreshTowerBar(){
    const bar = document.getElementById("towerBar"); if (!bar) return;
    for (const card of bar.children){
      const key = card.dataset.key;
      card.classList.toggle("disabled", this.food < TOWER_DEFS[key].price);
      card.classList.toggle("selected", this.selectedBuildKey === key);
    }
  }
  selectBuildKey(key){
    if (this.state !== "PREP" && this.state !== "WAVE") return;
    const def = TOWER_DEFS[key];
    if (!def) return;
    if (this.food < def.price){ this.toast("Không đủ lương thực!"); return; }
    if (this.selectedBuildKey === key){
      this.selectedBuildKey = null; this.refreshTowerBar(); this.updatePlaceHint(); this.clearSlotHighlights(); return;
    }
    this.selectedBuildKey = key; this.selectedTower = null; this.hideActionPanel();
    this.refreshTowerBar(); this.updatePlaceHint(); this.highlightValidSlots();
    if (key === "trap") this.toast("Chạm vào điểm BẪY trên đường để đặt");
    else this.toast("Chạm vào ô đặt quân hai bên đường");
  }
  updatePlaceHint(){
    const el = document.getElementById("placeHint");
    if (this.selectedBuildKey){
      el.textContent = this.selectedBuildKey === "trap" ? "Chạm điểm BẪY trên đường" : `Đang chọn: ${TOWER_DEFS[this.selectedBuildKey].name}`;
      el.classList.add("show");
    } else el.classList.remove("show");
  }
  highlightValidSlots(){ this._highlightActive = !!this.selectedBuildKey; this._highlightIsTrap = this.selectedBuildKey === "trap"; }
  clearSlotHighlights(){ this._highlightActive = false; this._highlightIsTrap = false; }

    resize(){
    // Kiểm tra thiết bị di động và hướng xoay
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPortrait = window.innerHeight > window.innerWidth;
    const lockScreen = document.getElementById("orientationLock");

    if (isMobile && isPortrait) {
      if (lockScreen) lockScreen.style.display = "flex";
      if (this.state === "PREP" || this.state === "WAVE") this.pauseGame();
    } else {
      if (lockScreen) lockScreen.style.display = "none";
    }

    const dpr = window.devicePixelRatio || 1; this.dpr = dpr;
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(w*dpr); this.canvas.height = Math.floor(h*dpr);
    const s = Math.min(w/MAP_W, h/MAP_H); this.scale = s;
    this.offX = (w - MAP_W*s)/2; this.offY = (h - MAP_H*s)/2;
  }
  screenToMap(clientX, clientY){
    const rect = this.canvas.getBoundingClientRect();
    return { x: (clientX - rect.left - this.offX) / this.scale, y: (clientY - rect.top - this.offY) / this.scale };
  }
  _bindInput(){
    const canvas = this.canvas;
    canvas.addEventListener("pointerdown", (e)=>{
      e.preventDefault(); AudioSys.init(); AudioSys.resume();
      const p = this.screenToMap(e.clientX, e.clientY);
      this.handleTap(p.x, p.y, e.clientX, e.clientY);
    });
    canvas.addEventListener("pointermove", (e)=>{
      const p = this.screenToMap(e.clientX, e.clientY);
      if (this.isDragging) {
        this.dragX = e.clientX; this.dragY = e.clientY;
        if (this.dragKey === "trap") {
          const tr = this.findTrapSpotAt(p.x, p.y); this.hoveredSlot = tr;
          this.canvas.style.cursor = (tr && !tr.trap) ? "copy" : "not-allowed";
        } else {
          const s = this.findSlotAt(p.x, p.y); this.hoveredSlot = s;
          this.canvas.style.cursor = (s && !s.tower) ? "copy" : "not-allowed";
        }
      } else this.handleHover(p.x, p.y, e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", (e)=>{
      if (this.isDragging) {
        const p = this.screenToMap(e.clientX, e.clientY);
        if (this.dragKey === "trap") {
          const tr = this.findTrapSpotAt(p.x, p.y);
          if (tr && !tr.trap) this.placeTrap(tr);
        } else {
          const s = this.findSlotAt(p.x, p.y);
          if (s && !s.tower) this.placeTower(this.dragKey, s);
        }
        this.isDragging = false; this.dragKey = null; this.hoveredSlot = null;
        this.canvas.style.cursor = "default";
      }
    });
    canvas.addEventListener("pointerleave", ()=>{ this.hideTooltip(); if (this.isDragging) this.canvas.style.cursor = "default"; });
    canvas.addEventListener("contextmenu", e=>e.preventDefault());

    window.addEventListener("keydown", (e)=>{
      if (this.state === "MENU" || this.state === "WIN" || this.state === "LOSE") return;
      if (e.code === "Space"){ e.preventDefault(); this.togglePause(); }
      else if (e.code === "Escape"){ this.selectedTower = null; this.hideActionPanel(); this.selectedBuildKey = null; this.refreshTowerBar(); this.updatePlaceHint(); this.clearSlotHighlights(); }
      else if (e.key >= "1" && e.key <= "6"){ const idx = parseInt(e.key,10)-1; if (TOWER_ORDER[idx]) this.selectBuildKey(TOWER_ORDER[idx]); }
      else if (e.key === "u" || e.key === "U"){ if (this.selectedTower) this.tryUpgrade(this.selectedTower); }
      else if (e.key === "s" || e.key === "S"){ if (this.selectedTower) this.trySell(this.selectedTower); }
    });
  }

  handleTap(mx, my, clientX, clientY){
    if (this.state === "MENU" || this.state === "WIN" || this.state === "LOSE" || this.state === "PAUSED") return;
    if (this.selectedBuildKey){
      if (this.selectedBuildKey === "trap"){
        const hitTrap = this.findTrapSpotAt(mx, my);
        if (hitTrap && !hitTrap.trap){ this.placeTrap(hitTrap); return; }
      } else {
        const hitSlot = this.findSlotAt(mx, my);
        if (hitSlot && !hitSlot.tower){ this.placeTower(this.selectedBuildKey, hitSlot); return; }
      }
      this.selectedBuildKey = null; this.refreshTowerBar(); this.updatePlaceHint(); this.clearSlotHighlights(); return;
    }
    const hitTower = this.findTowerAt(mx, my);
    if (hitTower){ this.selectTower(hitTower, clientX, clientY); return; }
    if (this.findSlotAt(mx, my)){ this.toast("Chọn loại quân ở thanh dưới đáy"); return; }
    const hitTrap = this.findTrapSpotAt(mx, my);
    if (hitTrap && !hitTrap.trap){ this.toast("Chọn 'Chông tre' 🎋 dưới đáy để đặt bẫy"); return; }
    this.selectedTower = null; this.hideActionPanel();
  }
  handleHover(mx, my, clientX, clientY){
    const t = this.findTowerAt(mx, my);
    if (t){ this.showTooltip(clientX, clientY, this.towerTooltipHTML(t)); this.canvas.style.cursor = "pointer"; return; }
    const s = this.findSlotAt(mx, my);
    if (s && !s.tower){ this.showTooltip(clientX, clientY, "<b>Ô đặt quân</b><br>Chọn quân ở thanh dưới."); this.canvas.style.cursor = "pointer"; return; }
    const tr = this.findTrapSpotAt(mx, my);
    if (tr && !tr.trap){ this.showTooltip(clientX, clientY, "<b>Điểm đặt bẫy</b><br>Chọn Chông tre 🎋."); this.canvas.style.cursor = "pointer"; return; }
    this.hideTooltip(); this.canvas.style.cursor = "default";
  }
  findSlotAt(mx,my){ return this.slots.find(s => dist2(mx,my,s.x,s.y) < 44*44); }
  findTowerAt(mx,my){ return this.towers.find(t => t.defKey !== "trap" && dist2(mx,my,t.x,t.y) < 36*36); }
  findTrapSpotAt(mx,my){ return this.trapSpots.find(s => dist2(mx,my,s.x,s.y) < 42*42); }

  placeTower(defKey, spot){
    if (this.food < TOWER_DEFS[defKey].price || spot.tower) return;
    this.food -= TOWER_DEFS[defKey].price;
    const t = new Tower(defKey, spot.x, spot.y, spot);
    spot.tower = t; this.towers.push(t); AudioSys.playSFX("sfx_place"); this.spawnParticles(spot.x, spot.y, 10, "#c8a850");
    this.updateHUD(); this.selectedTower = t; this.selectedBuildKey = null; this.refreshTowerBar(); this.updatePlaceHint(); this.clearSlotHighlights();
  }
  placeTrap(spot){
    if (this.food < CONFIG.trapPrice || spot.trap) return;
    this.food -= CONFIG.trapPrice;
    const trap = { defKey:"trap", x:spot.x, y:spot.y, uses:CONFIG.trapUses, cooldown:0, dead:false, animT:0, stunTimer:0 };
    spot.trap = trap; this.traps.push(trap); AudioSys.playSFX("sfx_place"); this.spawnParticles(spot.x, spot.y, 8, "#7a6b2b");
    this.updateHUD(); this.selectedBuildKey = null; this.refreshTowerBar(); this.updatePlaceHint(); this.clearSlotHighlights();
  }

  selectTower(t, clientX, clientY){ this.selectedTower = t; this.openActionPanel(t, clientX, clientY); }
  openActionPanel(t, clientX, clientY){
    const panel = document.getElementById("towerActionPanel");
    const wrapRect = document.getElementById("gameWrap").getBoundingClientRect();
    let left = clientX - wrapRect.left + 20, top = clientY - wrapRect.top - 20;
    if (left + 200 > wrapRect.width) left = wrapRect.width - 210;
    if (top < 10) top = 10;
    panel.style.left = left+"px"; panel.style.top = top+"px";
    
    if (t.defKey === "trap"){
      panel.innerHTML = `<div class="infoTitle">🎋 Bẫy chông tre</div><div class="infoStat">Lượt còn: ${t.uses}/3</div>
        <div class="actRow"><button class="actBtn sell" data-act="sell">Bán<span class="sub">+${Math.round(CONFIG.trapPrice*0.6)}💰</span></button></div>`;
      panel.querySelector('[data-act="sell"]').addEventListener("pointerdown",(ev)=>{ ev.preventDefault(); ev.stopPropagation(); this.sellTrap(t); this.hideActionPanel(); this.selectedTower=null; });
    } else {
      const def = TOWER_DEFS[t.defKey], canUp = t.level < 3, canAffordUp = canUp && this.food >= t.upgradeCost;
      let stat = def.damage > 0 ? `ST: <b>${Math.round(t.damage)}</b> • Tầm: <b>${Math.round(t.range)}</b><br>` : "";
      stat += `Đầu tư: ${t.invested}💰`;
      panel.innerHTML = `<div class="infoTitle">${def.icon} ${def.name} — Cấp ${t.level}</div><div class="infoStat">${stat}</div>
        <div class="actRow">
          ${canUp ? `<button class="actBtn up ${canAffordUp?"":"disabled"}" data-act="up">Nâng cấp<span class="sub">${t.upgradeCost}💰</span></button>` : `<button class="actBtn disabled" disabled>Max cấp</button>`}
          <button class="actBtn sell" data-act="sell">Bán<span class="sub">+${t.sellValue}💰</span></button>
        </div>`;
      const upBtn = panel.querySelector('[data-act="up"]'); if (upBtn) upBtn.addEventListener("pointerdown", (ev)=>{ ev.preventDefault(); ev.stopPropagation(); this.tryUpgrade(t); });
      const sellBtn = panel.querySelector('[data-act="sell"]'); if (sellBtn) sellBtn.addEventListener("pointerdown", (ev)=>{ ev.preventDefault(); ev.stopPropagation(); this.trySell(t); this.hideActionPanel(); this.selectedTower=null; });
    }
    panel.classList.add("show");
  }
  hideActionPanel(){ document.getElementById("towerActionPanel").classList.remove("show"); }
  tryUpgrade(t){
    if (!t || t.level >= 3 || this.food < t.upgradeCost) return;
    this.food -= t.upgradeCost; t.invested += t.upgradeCost; t.level++;
    AudioSys.playSFX("sfx_upgrade"); this.spawnParticles(t.x, t.y-14, 14, "#ffd75e", "star"); this.updateHUD();
    const panel = document.getElementById("towerActionPanel");
    if (panel.classList.contains("show")){ const r = panel.getBoundingClientRect(); const wr = document.getElementById("gameWrap").getBoundingClientRect(); this.openActionPanel(t, r.left - wr.left + 20, r.top - wr.top + 20); }
  }
  trySell(t){
    if (!t) return;
    if (t.defKey === "trap"){ this.sellTrap(t); return; }
    const idx = this.towers.indexOf(t); if (idx < 0) return;
    this.towers.splice(idx,1); if (t.slot) t.slot.tower = null;
    this.food += t.sellValue; AudioSys.playSFX("sfx_sell"); this.spawnParticles(t.x, t.y, 10, "#c8a850");
    this.selectedTower = null; this.updateHUD(); this.refreshTowerBar();
  }
  sellTrap(t){
    const idx = this.traps.indexOf(t); if (idx >= 0) this.traps.splice(idx,1);
    for (const sp of this.trapSpots){ if (sp.trap === t) sp.trap = null; }
    this.food += Math.round(CONFIG.trapPrice*0.6); AudioSys.playSFX("sfx_sell"); this.updateHUD(); this.refreshTowerBar();
  }

  showTooltip(clientX, clientY, html){
    const tip = document.getElementById("tooltip"), wrapRect = document.getElementById("gameWrap").getBoundingClientRect();
    tip.innerHTML = html; tip.classList.add("show");
    let x = clientX - wrapRect.left + 16, y = clientY - wrapRect.top - 10;
    if (x + tip.offsetWidth > wrapRect.width - 8) x = clientX - wrapRect.left - tip.offsetWidth - 12;
    if (y < 6) y = 6; if (y + tip.offsetHeight > wrapRect.height - 6) y = wrapRect.height - tip.offsetHeight - 6;
    tip.style.left = x+"px"; tip.style.top = y+"px";
  }
  hideTooltip(){ document.getElementById("tooltip").classList.remove("show"); }
  defTooltipHTML(def, key){
    let s = `<b>${def.name}</b><br>${def.desc}<br>Giá: <b>${def.price}💰</b>`;
    if (key !== "support" && key !== "trap") s += `<br>ST: ${def.damage} • Tốc: ${def.fireRate}s • Tầm: ${def.range}`;
    return s;
  }
  towerTooltipHTML(t){
    const def = TOWER_DEFS[t.defKey];
    let s = `<b>${def.name}</b> (Cấp ${t.level})<br>`;
    if (def.damage > 0) s += `ST: <b>${Math.round(t.damage)}</b><br>Tầm: <b>${Math.round(t.range)}</b><br>`;
    if (def.fireRate > 0) s += `Tốc bắn: ${(t.fireInterval / (1+t.buffRate)).toFixed(2)}s<br>`;
    s += `Bán: ${t.sellValue}💰`; return s;
  }

  spawnParticles(x,y,n,color,type="dot"){
    for (let i=0;i<n;i++){
      if (this.particles.length >= CONFIG.maxParticles) break;
      const a = Math.random()*Math.PI*2, sp = 30+Math.random()*90;
      this.particles.push(new Particle({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-20, life:0.4+Math.random()*0.4, size:2+Math.random()*3, color, gravity:120, type }));
    }
  }
  spawnMuzzle(x,y,ang){
    for (let i=0;i<5;i++){
      if (this.particles.length >= CONFIG.maxParticles) break;
      const a = ang + (Math.random()-0.5)*0.5, sp = 80+Math.random()*120;
      this.particles.push(new Particle({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:0.12+Math.random()*0.1, size:2+Math.random()*3, color: Math.random()<0.5 ? "#ffd75e" : "#ff8a1f" }));
    }
  }
  spawnCasing(x,y,ang){
    if (this.particles.length >= CONFIG.maxParticles) return;
    const a = ang + Math.PI/2 + (Math.random()-0.5);
    this.particles.push(new Particle({ x, y, vx:Math.cos(a)*60, vy:Math.sin(a)*60-40, life:0.6, size:2, color:"#c8a850", gravity:260 }));
  }
  spawnDamageText(x,y,dmg){ this.damageTexts.push({x,y,text:String(dmg),life:0.8,max:0.8,vy:-40}); }
  spawnExplosion(x,y,r,isBig){
    const n = this.isMobile ? (isBig ? 10 : 6) : (isBig ? 22 : 14);
    
    for (let i=0;i<n;i++){
      if (this.particles.length >= CONFIG.maxParticles) break;
      const a = Math.random()*Math.PI*2, sp = 40+Math.random()*r*3;
      this.particles.push(new Particle({ x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:0.3+Math.random()*0.4, size:3+Math.random()*5, color: Math.random()<0.5 ? "#ff8a1f" : (Math.random()<0.5?"#ffd75e":"#8a3a1a"), gravity:80 }));
    }
    for (let i=0;i<6;i++){
      if (this.particles.length >= CONFIG.maxParticles) break;
      this.particles.push(new Particle({ x:x+(Math.random()-0.5)*r, y:y+(Math.random()-0.5)*r, vx:(Math.random()-0.5)*20, vy:-30-Math.random()*30, life:0.6+Math.random()*0.5, size:6+Math.random()*8, color:"#555", gravity:-10 }));
    }
  }
  spawnShell(x,y,target,splash,game){ this.shells.push(new Shell({ x, y, tx:target.x, ty:target.y, dur:0.75, splash, game })); }
  shakeScreen(amt){ this.screenShake = Math.max(this.screenShake, amt); }

  startWave(){
    if (this.mode !== "endless" && this.waveIndex >= WAVES.length) return;
    
    this.state = "WAVE"; this.waveActive = true; this.spawnQueue = [];
    let t = 0;
    
    if (this.mode === "endless" && this.waveIndex >= WAVES.length) {
      const extra = this.waveIndex - 9; 
      const pool = ["french", "japanese", "scout", "officer", "armored"];
      if (extra % 3 === 0) pool.push("tank");
      
      const totalEnemies = 10 + extra * 3;
      for (let i=0; i<totalEnemies; i++) {
        const type = pool[Math.floor(Math.random() * pool.length)];
        this.spawnQueue.push({ type: type, at: t });
        t += 0.5 + Math.random() * 0.5; 
      }
    } else {
      for (const grp of WAVES[this.waveIndex]){
        const delay = grp.delay || 0;
        for (let i=0;i<grp.count;i++){ this.spawnQueue.push({ type:grp.type, at: t + delay }); t += grp.gap; }
        t += 0.3;
      }
    }
    
    this.spawnQueue.sort((a,b)=>a.at-b.at); this.spawnTimer = 0; this.bossSpawned = false; this.bossWarned = false;
    
    let displayWave = (this.waveIndex + 1);
    document.getElementById("waveTxt").textContent = (this.mode === "endless") ? `Bất khả thi (${displayWave})` : `${displayWave}/${WAVES.length}`;
    this.showBanner("ĐỢT " + displayWave);
    
    // Chuyển ngày đêm
    if (this.mode === "endless") {
      const cycle = this.waveIndex % 10;
      const nextTime = cycle < 6 ? "day" : (cycle < 9 ? "dusk" : "night");
      if (this.timeOfDay !== nextTime) { 
        this.prevTimeOfDay = this.timeOfDay; 
        this.timeOfDay = nextTime; 
        this.bgAlpha = 0; 
        AudioSys.setAmbient(nextTime === "day" ? "day" : "night");
      }
    } else {
      const nextTime = this.waveIndex < 6 ? "day" : (this.waveIndex < 9 ? "dusk" : "night");
      if (this.timeOfDay !== nextTime) { 
        this.prevTimeOfDay = this.timeOfDay; 
        this.timeOfDay = nextTime; 
        this.bgAlpha = 0; 
        AudioSys.setAmbient(nextTime === "day" ? "day" : "night");
      }
    }
    
    if (this.waveIndex === 9 || (this.mode === "endless" && this.waveIndex >= 10 && this.waveIndex % 3 === 0)) {
      setTimeout(()=>{ if (this.state === "WAVE" || this.state === "PREP"){ this.showBanner("XE TĂNG ĐANG TIẾN TỚI!"); AudioSys.playSFX("sfx_alarm"); this.flashRed = 2.2; } }, 600);
    }
    this.updateHUD();
  }
  showBanner(text){
    const b = document.getElementById("waveBanner"); b.textContent = text; b.classList.add("show");
    clearTimeout(this._bannerTO); this._bannerTO = setTimeout(()=>b.classList.remove("show"), 1800);
  }
  onEnemyKilled(e){ this.kills++; this.food += e.def.reward; this.spawnParticles(e.x, e.y, 10, "#ff8a1f"); this.updateHUD(); }
  
  onEnemyReachedBase(e){
    this.flashRed = 1.5; this.shakeScreen(15); AudioSys.playSFX("sfx_explode");
    
    if (this.mode === "easy" || this.mode === "endless") {
      this.safety -= e.def.safetyCost;
      if (this.safety < 0) this.safety = 0;
      this.updateHUD();
      if (this.safety <= 0) this.gameOver(false);
    } else {
      this.gameOver(false);
    }
  }
  
  onBossKilled(boss){
    this.slowMoTimer = 1.0; this.showBanner("THẮNG LỢI!"); AudioSys.playSFX("sfx_win");
    this.spawnExplosion(boss.x, boss.y, 60, true); this.spawnExplosion(boss.x+20, boss.y-10, 50, true); this.shakeScreen(16);
    if (this.mode !== "endless") {
      setTimeout(()=>{ if (this.state !== "LOSE") this.gameOver(true); }, 1600);
    }
  }
  
  gameOver(win){
    if (this.state === "WIN" || this.state === "LOSE") return;
    this.state = win ? "WIN" : "LOSE"; 
    AudioSys.stopMusicLoop(); 
    if (win) AudioSys.playSFX("sfx_win"); else AudioSys.playSFX("sfx_lose");
    this.screenShake = 0; 

    const mins = Math.floor(this.totalGameTime / 60);
    const secs = Math.floor(this.totalGameTime % 60);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    let bestStr = "--";
    let stars = 0;

    if (!win) {
      stars = 0;
      document.getElementById("endTitle").textContent = "CHIẾN DỊCH BẢO VỆ ĐÃ THẤT BẠI";
      document.getElementById("endTitle").style.color = "#c8102e";
      document.getElementById("endWave").textContent = Math.max(0, this.waveIndex) + "/" + WAVES.length;
    } else {
      if (this.mode === "easy" || this.mode === "endless") {
        if (this.safety < 7) stars = 1;
        else if (this.safety <= 14) stars = 2;
        else stars = 3;
      } else {
        stars = 3;
      }
      document.getElementById("endTitle").textContent = "BẢO VỆ THÀNH CÔNG!";
      document.getElementById("endTitle").style.color = "#ffcc00";
      document.getElementById("endWave").textContent = WAVES.length + "/" + WAVES.length;
    }

    if (this.mode === "endless") {
      let bestWave = 0;
      try {
        const saved = localStorage.getItem("pacbo_best_endless");
        if (saved) bestWave = parseInt(saved);
        if (this.waveIndex + 1 > bestWave) {
          bestWave = this.waveIndex + 1;
          localStorage.setItem("pacbo_best_endless", String(bestWave));
        }
      } catch(e){}
      bestStr = `Đợt ${bestWave}`;
      document.getElementById("endBest").parentElement.children[0].textContent = "Kỷ lục bất khả thi:";
      document.getElementById("endWave").parentElement.children[0].textContent = "Số đợt sinh tồn:";
    } else {
      let bestTime = null;
      try {
        const saved = localStorage.getItem("pacbo_best_time");
        if (saved) bestTime = parseFloat(saved);
        if (win) {
          if (bestTime === null || this.totalGameTime < bestTime) {
            bestTime = this.totalGameTime; localStorage.setItem("pacbo_best_time", String(bestTime));
          }
        }
      } catch(e){}
      if (bestTime !== null) {
        const bm = Math.floor(bestTime / 60); const bs = Math.floor(bestTime % 60);
        bestStr = `${String(bm).padStart(2, '0')}:${String(bs).padStart(2, '0')}`;
      }
      document.getElementById("endBest").parentElement.children[0].textContent = "Kỷ lục thời gian:";
      document.getElementById("endWave").parentElement.children[0].textContent = "Đợt đạt được:";
    }

    const starEl = document.getElementById("endStars");
    starEl.innerHTML = "";
    for (let i=0;i<3;i++){
      const s = document.createElement("span");
      s.textContent = "★";
      if (i < stars) s.classList.add("on");
      starEl.appendChild(s);
    }

    document.getElementById("endTitle").style.fontSize = "clamp(20px, 5vw, 32px)";
    document.getElementById("endKills").textContent = this.kills;
    document.getElementById("endTime").textContent = timeStr;
    document.getElementById("endBest").textContent = bestStr;

    showOverlay("endOverlay"); this.updateHUD();
  }

  start(){ this.lastTime = performance.now(); this.rafId = requestAnimationFrame(this._loop); }
  _loop(now){
    this.rafId = requestAnimationFrame(this._loop);
    let dt = (now - this.lastTime)/1000; this.lastTime = now;
    if (dt > CONFIG.maxDt) dt = CONFIG.maxDt; if (dt < 0) dt = 0;
    this.update(dt); this.render();
  }
  
  update(dt){
    if (this.state === "PAUSED" || this.state === "MENU" || this.state === "WIN" || this.state === "LOSE"){
      this.screenShake = 0;
      return;
    }

    if (this.isMobile) {
      CONFIG.maxParticles = 100; // Giảm từ 300 xuống 100
    }

    if (this.state === "PREP" || this.state === "WAVE") {
      this.totalGameTime += dt;
    }

    this.ambientT += dt; this.leafT += dt;
    for (const f of this.fireflies){ f.t += dt * f.sp; if (f.t > 10){ f.t = 0; f.x = Math.random()*MAP_W; f.y = Math.random()*MAP_H; } }
    for (const b of this.birds){ b.x += b.sp * dt; b.ph += dt*2; if (b.x > MAP_W+60) b.x = -60; }
    
    this.updateWeather(dt);

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt*22);
    if (this.flashRed > 0){ this.flashRed -= dt; const el = document.getElementById("redFlash"); if (this.flashRed > 0) el.classList.add("on"); else el.classList.remove("on"); }
    
    if (this.bgAlpha < 1) { this.bgAlpha += dt * 0.6; if (this.bgAlpha > 1) this.bgAlpha = 1; }

    let simDt = dt;
    if (this.slowMoTimer > 0){ this.slowMoTimer -= dt; simDt = dt * 0.25; }
    
    if (this.state === "PREP"){
      if (this.prepTimer > 0) {
        this.prepTimer -= simDt * this.speedMul;
        if (this.prepTimer <= 0) { this.prepTimer = 0; this.startWave(); }
      }
      this.updateHUD();
    }
    if (this.state === "WAVE" && this.waveActive){
      this.spawnTimer += simDt * this.speedMul;
      while (this.spawnQueue.length && this.spawnQueue[0].at <= this.spawnTimer){
        const item = this.spawnQueue.shift(); const e = new Enemy(item.type, this, 0); this.enemies.push(e);
        if (item.type === "tank"){ this.boss = e; this.bossSpawned = true; document.getElementById("bossBarWrap").classList.add("show"); }
      }
    }
    this.updateBuffs();
    for (const t of this.towers) t.update(simDt * this.speedMul, this);
    for (const tr of this.traps){ if (!tr.dead) this.updateTrap(tr, simDt); }
    this.updateOfficerAuras();
    for (const e of this.enemies) e.update(simDt * this.speedMul, this);
    for (const p of this.projectiles) p.update(simDt * this.speedMul, this);
    for (const s of this.shells) s.update(simDt * this.speedMul);
    this.updateParticles(simDt * this.speedMul);
    for (const d of this.damageTexts){ d.y += d.vy * simDt; d.life -= simDt; }

    this.enemies = this.enemies.filter(e=>!e.dead || e.reachedBase);
    this.projectiles = this.projectiles.filter(p=>!p.dead);
    this.shells = this.shells.filter(s=>!s.dead);
    this.damageTexts = this.damageTexts.filter(d=>d.life>0);
    this.traps = this.traps.filter(t=>!t.dead);
    if (this.particles.length > CONFIG.maxParticles) this.particles.splice(0, this.particles.length - CONFIG.maxParticles);
    this.particles = this.particles.filter(p=>!p.dead);

    if (this.state === "WAVE" && this.waveActive && this.spawnQueue.length === 0){
      if (!this.enemies.some(e=>!e.dead)) this.endWave();
    }
    if (this.boss && !this.boss.dead){
      document.getElementById("bossFill").style.width = (clamp(this.boss.hp / this.boss.maxHp, 0, 1)*100)+"%";
    } else if (this.boss && this.boss.dead){
      document.getElementById("bossBarWrap").classList.remove("show");
    }
  }
  
  updateWeather(dt) {
    for (const f of this.fogLayers) {
      f.x += f.speed * dt;
      if (f.x > MAP_W + f.size) f.x = -f.size;
    }

    const isRaining = (this.waveIndex === 9 && this.state === "WAVE") || (this.mode === "endless" && this.waveIndex >= 5);
    
    // Chuyển Ambient mưa
    if (isRaining && AudioSys.currentAmbient !== "rain") {
      AudioSys.setAmbient("rain");
    } else if (!isRaining && AudioSys.currentAmbient === "rain") {
      AudioSys.setAmbient(this.timeOfDay === "night" ? "night" : "day");
    }

    if (isRaining) {
      for (let i=0; i<3; i++) {
        this.rainParticles.push({
          x: Math.random() * MAP_W * 1.2 - 100,
          y: -20,
          vy: 600 + Math.random() * 200,
          vx: -100 - Math.random() * 50,
          len: 10 + Math.random() * 15
        });
      }
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 4 + Math.random() * 6;
        this.flashRed = 0.2;
      }
    }

    for (const p of this.rainParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.rainParticles = this.rainParticles.filter(p => p.y < MAP_H + 50);
  }

  updateParticles(dt){ for (const p of this.particles) p.update(dt); this.particles = this.particles.filter(p=>!p.dead); }
  
  updateTrap(trap, dt){
    if (trap.dead) return; trap.animT += dt;
    if (trap.cooldown > 0) trap.cooldown -= dt; if (trap.cooldown > 0) return;
    const r2 = 26*26;
    for (const e of this.enemies){
      if (e.dead || dist2(trap.x, trap.y, e.x, e.y) > r2) continue;
      if (e.isTank){ trap.dead = true; for (const sp of this.trapSpots){ if (sp.trap === trap) sp.trap = null; } this.spawnParticles(trap.x, trap.y, 12, "#7a6b2b"); this.showBanner("XE TĂNG NGHIỀN QUA BẪY!"); return; }
      e.takeDamage(CONFIG.trapDamage, this, null); e.slowTimer = CONFIG.trapSlowDur; e.slowFactor = CONFIG.trapSlow;
      trap.uses--; trap.cooldown = 0.4; this.spawnParticles(trap.x, trap.y, 8, "#a8c84a"); AudioSys.playSFX("sfx_place");
      if (trap.uses <= 0){ trap.dead = true; for (const sp of this.trapSpots){ if (sp.trap === trap) sp.trap = null; } }
      break;
    }
  }
  updateBuffs(){
    for (const t of this.towers){ if (t.buffRate !== undefined){ t.buffRate = 0; t.stunResist = false; } }
    for (const s of this.towers){
      if (s.defKey !== "support" || s.stunTimer > 0) continue;
      const r2 = s.def.range * s.def.range;
      for (const t of this.towers){
        if (t === s || t.defKey === "support" || t.defKey === "trap") continue;
        if (dist2(s.x,s.y,t.x,t.y) <= r2){ if (s.def.buffRates[s.level-1] > t.buffRate) t.buffRate = s.def.buffRates[s.level-1]; t.stunResist = true; }
      }
    }
  }
  updateOfficerAuras(){
    for (const e of this.enemies) e.officerBoost = 1;
    for (const e of this.enemies){
      if (!e.aura || e.dead) continue; const r2 = e.aura.radius * e.aura.radius;
      for (const o of this.enemies){ if (o !== e && !o.dead && dist2(e.x,e.y,o.x,o.y) <= r2){ if (o.officerBoost < e.aura.speedMul) o.officerBoost = e.aura.speedMul; } }
    }
  }
  endWave(){
    this.waveActive = false; const bonus = CONFIG.waveClearBase + CONFIG.waveClearPerWave * (this.waveIndex+1);
    this.food += bonus; 
    
    const displayWave = this.waveIndex + 1;
    this.toast(`HOÀN THÀNH ĐỢT ${displayWave}! +${bonus}💰`);
    this.showBanner(`KẾT THÚC ĐỢT ${displayWave}`);
    
    if (this.mode !== "endless" && this.waveIndex >= WAVES.length - 1){ 
      if (this.boss && this.boss.dead) this.gameOver(true); 
      return; 
    }
    
    this.waveIndex++; 
    this.state = "PAUSED"; 
    this.screenShake = 0; 
    this.prepTimer = CONFIG.prepTime;
    this.updateHUD(); 
    this.updatePrepInfo();

    setTimeout(() => {
      if (this.state === "PAUSED") {
        this.state = "PREP";
      }
    }, 2000);
  }
  
  startPrep(){
    this.state = "PREP"; this.prepTimer = CONFIG.prepTime; this.waveIndex = 0;
    this.updateHUD(); this.updatePrepInfo(); document.getElementById("bossBarWrap").classList.remove("show"); this.showBanner("CHUẨN BỊ ĐỢT 1");
    AudioSys.setAmbient("day");
  }
  pauseGame(){ if (this.state === "PREP" || this.state === "WAVE"){ this._pausedState = this.state; this.state = "PAUSED"; this.screenShake = 0; showOverlay("pauseOverlay"); AudioSys.setAmbient(""); } }
  togglePause(){ if (this.state === "PAUSED"){ hideOverlay("pauseOverlay"); this.state = this._pausedState || "WAVE"; AudioSys.setAmbient(this.timeOfDay === "night" ? "night" : "day"); } else if (this.state === "PREP" || this.state === "WAVE"){ this.pauseGame(); } }
  
  updateHUD(){
    document.getElementById("foodTxt").textContent = this.food;
    
    const mins = Math.floor(this.totalGameTime / 60);
    const secs = Math.floor(this.totalGameTime % 60);
    document.getElementById("timeTxt").textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    let displayWave = (this.waveIndex + (this.state==="WAVE"?1:0));
    document.getElementById("waveTxt").textContent = (this.mode === "endless") ? `Bất khả thi (${displayWave})` : `${displayWave}/${WAVES.length}`;
    
    if (this.mode === "easy" || this.mode === "endless") {
      const sTxt = document.getElementById("safetyTxt");
      const sFill = document.getElementById("safetyFill");
      if (sTxt) sTxt.textContent = `Độ an toàn căn cứ: ${this.safety}/${this.mode === "easy" ? CONFIG.safetyEasy : CONFIG.safetyEndless}`;
      if (sFill) sFill.style.width = (clamp(this.safety/(this.mode === "easy" ? CONFIG.safetyEasy : CONFIG.safetyEndless),0,1)*100)+"%";
    }
    
    this.refreshTowerBar();
  }
  
  updatePrepInfo(){
    if (this.state === "PAUSED") return;

    const card = document.getElementById("prepCard"); 
    const countdownText = document.getElementById("countdownText");

    if (this.state !== "PREP"){ 
      card.textContent = ""; 
      if (countdownText) countdownText.classList.remove("show"); 
      this.lastCountdown = null; 
      return; 
    }
    
    const nextWave = WAVES[this.waveIndex]; 
    if (!nextWave){ card.textContent = ""; return; }
    
    const counts = {}; for (const g of nextWave) counts[g.type] = (counts[g.type]||0) + g.count;
    const list = []; for (const k in counts) list.push(`${ENEMY_DEFS[k].short} x${counts[k]}`);
    card.innerHTML = `<b>ĐỢT ${this.waveIndex+1} CHUẨN BỊ: ${Math.ceil(this.prepTimer)}s</b><div class="enemyList">Sắp tới: ${list.join(" • ")}</div>`;

    if (this.prepTimer <= 5 && this.prepTimer > 0) {
      if (countdownText) {
        countdownText.classList.add("show");
        let currentSecond = Math.ceil(this.prepTimer);
        
        if (this.lastCountdown !== currentSecond) {
          this.lastCountdown = currentSecond;
          countdownText.textContent = currentSecond;
          countdownText.style.animation = 'none'; countdownText.offsetHeight; 
          countdownText.style.animation = 'countdownPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1 forwards';
        }
      }
    } else {
      if (countdownText) countdownText.classList.remove("show");
      this.lastCountdown = null;
    }
  }
  toast(msg){ const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(this._toastTO); this._toastTO = setTimeout(()=>el.classList.remove("show"), 1800); }

  /* ==================== RENDER ==================== */
  render(){
    const ctx = this.ctx, dpr = this.dpr;
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle = "#0d0a06"; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    let shakeX = 0, shakeY = 0;
    if (this.screenShake > 0 && this.state !== "PAUSED" && this.state !== "WIN" && this.state !== "LOSE"){ 
      shakeX = (Math.random()-0.5)*this.screenShake*2; 
      shakeY = (Math.random()-0.5)*this.screenShake*2; 
    }
    ctx.setTransform(dpr*this.scale, 0, 0, dpr*this.scale, dpr*(this.offX+shakeX), dpr*(this.offY+shakeY));

    this.drawMap(ctx);
    this.drawWeather(ctx);
    this.drawSlots(ctx); this.drawTrapSpots(ctx);
    
    if (this.isDragging && this.hoveredSlot) {
      let active = false;
      if (this.dragKey === "trap") active = !this.hoveredSlot.trap;
      else active = !this.hoveredSlot.tower;

      if (active) {
        ctx.save();
        ctx.globalAlpha = 0.5; 
        ctx.beginPath(); ctx.arc(this.hoveredSlot.x, this.hoveredSlot.y, 24, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255, 215, 94, 0.4)"; ctx.fill();
        ctx.strokeStyle = "#ffd75e"; ctx.lineWidth = 3; ctx.stroke();
        
        const img = SPRITE_IMGS[this.dragKey];
        if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, this.hoveredSlot.x - 23, this.hoveredSlot.y - 36, 46, 46);
        else {
          ctx.fillStyle = TOWER_DEFS[this.dragKey].color;
          ctx.font = "bold 20px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(TOWER_DEFS[this.dragKey].icon, this.hoveredSlot.x, this.hoveredSlot.y);
        }
        ctx.restore();
      }
    }

    const drawables = [];
    for (const t of this.towers){ if (t.defKey !== "trap") drawables.push({y:t.y, obj:t, kind:"tower"}); }
    for (const e of this.enemies) drawables.push({y:e.y, obj:e, kind:"enemy"});
    drawables.sort((a,b)=>a.y-b.y);
    
    for (const d of drawables){ if (d.kind === "tower") this.drawTower(ctx, d.obj); else this.drawEnemy(ctx, d.obj); }
    for (const tr of this.traps){ if (!tr.dead) this.drawTrap(ctx, tr); }
    for (const p of this.projectiles) this.drawProjectile(ctx, p);
    for (const s of this.shells) this.drawShell(ctx, s);
    for (const p of this.particles) this.drawParticle(ctx, p);
    for (const d of this.damageTexts) this.drawDamageText(ctx, d);

    if (this.selectedTower && this.selectedTower.range > 0){
      const t = this.selectedTower;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,205,0,0.08)"; ctx.fill();
      ctx.strokeStyle = "rgba(255,205,0,0.5)"; ctx.lineWidth = 2; ctx.setLineDash([8,6]); ctx.stroke(); ctx.setLineDash([]);
    }
    this.drawSunRays(ctx); this.drawLeaves(ctx); this.drawBirds(ctx);
    if (!this.isMobile || this.state !== "WAVE") {
      this.drawBirds(ctx);
      if (this.timeOfDay === "night") this.drawFireflies(ctx);
    }
    this.drawVignette(ctx);
    
    if (this.state === "PREP" && this.prepTimer <= 5 && this.prepTimer > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(-200, -200, MAP_W + 400, MAP_H + 400);
    }

    if (this.state === "PREP") this.updatePrepInfo();
  }

  drawWeather(ctx) {
    for (const f of this.fogLayers) {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
      grad.addColorStop(0, `rgba(220, 230, 240, ${f.alpha})`);
      grad.addColorStop(1, "rgba(220, 230, 240, 0)");
      ctx.fillStyle = grad;
      ctx.arc(f.x, f.y, f.size, 0, Math.PI*2);
      ctx.fill();
    }

    if (this.rainParticles.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(180, 200, 255, 0.4)";
      ctx.lineWidth = 1.5;
      for (const p of this.rainParticles) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.02, p.y + p.len);
      }
      ctx.stroke();
    }
  }

  drawMap(ctx){
    let bgKey = "map_day"; if (this.timeOfDay === "dusk") bgKey = "map_dusk"; else if (this.timeOfDay === "night") bgKey = "map_night";
    let prevBgKey = "map_day"; if (this.prevTimeOfDay === "dusk") prevBgKey = "map_dusk"; else if (this.prevTimeOfDay === "night") prevBgKey = "map_night";
    const bgImg = SPRITE_IMGS[bgKey], prevBgImg = SPRITE_IMGS[prevBgKey];
    if (this.bgAlpha < 1 && prevBgImg && prevBgImg.complete && prevBgImg.naturalWidth > 0) { ctx.globalAlpha = 1; ctx.drawImage(prevBgImg, 0, 0, MAP_W, MAP_H); }
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) { ctx.globalAlpha = this.bgAlpha; ctx.drawImage(bgImg, 0, 0, MAP_W, MAP_H); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = "#3a5524"; ctx.fillRect(-200,-200,MAP_W+400,MAP_H+400); }
  }

  drawSlots(ctx){
    for (const s of this.slots){
      if (s.tower) continue;
      const active = (this._highlightActive && !this._highlightIsTrap) || (this.isDragging && this.dragKey !== "trap" && this.hoveredSlot === s);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(s.x, s.y+8, 26, 10, 0, 0, Math.PI*2); ctx.fillStyle = "rgba(30,20,10,.35)"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(s.x, s.y+6, 24, 12, 0, 0, Math.PI*2); ctx.fillStyle = this.timeOfDay==="night" ? "rgba(30,40,25,.7)" : "rgba(110,80,40,.5)"; ctx.fill();
      ctx.beginPath(); ctx.arc(s.x, s.y, 17, 0, Math.PI*2); ctx.fillStyle = this.timeOfDay==="night" ? "rgba(40,60,40,.55)" : "rgba(90,130,70,.6)"; ctx.fill();
      
      if (active){
        const pulse = 0.5 + Math.sin(this.ambientT*6)*0.35;
        ctx.strokeStyle = `rgba(255,215,94,${0.5+pulse*0.5})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = `rgba(255,215,94,${pulse})`;
        ctx.beginPath(); ctx.moveTo(s.x-5, s.y-28); ctx.lineTo(s.x+5, s.y-28); ctx.lineTo(s.x, s.y-20); ctx.closePath(); ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(255,205,0,.35)"; ctx.lineWidth = 1.5; ctx.setLineDash([4,5]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = active ? "rgba(255,255,220,.95)" : "rgba(255,255,220,.6)";
      ctx.font = "bold 17px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("+", s.x, s.y-1); ctx.restore();
    }
  }
  drawTrapSpots(ctx){
    for (const sp of this.trapSpots){
      if (sp.trap) continue;
      const active = (this._highlightActive && this._highlightIsTrap) || (this.isDragging && this.dragKey === "trap" && this.hoveredSlot === sp);
      ctx.save();
      ctx.beginPath(); ctx.arc(sp.x, sp.y, active ? 17 : 13, 0, Math.PI*2);
      ctx.strokeStyle = active ? `rgba(150,255,80,${0.6+Math.sin(this.ambientT*8)*0.4})` : "rgba(180,200,80,.5)"; ctx.lineWidth = active ? 3 : 2;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = active ? "rgba(180,255,80,.55)" : "rgba(180,200,80,.4)";
      ctx.font = "bold 11px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("BẪY", sp.x, sp.y+4); ctx.restore();
    }
  }
  drawTower(ctx, t){
    const def = TOWER_DEFS[t.defKey];
    ctx.save();
    ctx.beginPath(); ctx.ellipse(t.x, t.y+15, 19, 7, 0, 0, Math.PI*2); ctx.fillStyle = "rgba(0,0,0,.32)"; ctx.fill();
    if (t.stunTimer > 0) ctx.globalAlpha = 0.65;
    const bob = Math.sin(t.animT*2)*1.5;
    ctx.translate(t.x, t.y + bob);

    const img = SPRITE_IMGS[t.defKey];
    if (img && img.complete && img.naturalWidth > 0){
      const size = 46; ctx.save();
      const baseDir = SPRITE_DIR[t.defKey] || "right";
      let flip = 1;
      if (baseDir === "right" && (t.angle > Math.PI/2 || t.angle < -Math.PI/2)) flip = -1;
      else if (baseDir === "left" && (t.angle < Math.PI/2 && t.angle > -Math.PI/2)) flip = -1;
      ctx.scale(flip, 1);
      ctx.drawImage(img, -size/2, -size*0.8, size, size);
      if (t.muzzleFlash > 0 && t.defKey !== "support"){
        const flashX = Math.cos(t.angle) * (size*0.6) * (flip), flashY = Math.sin(t.angle) * (size*0.6);
        ctx.beginPath(); ctx.arc(flashX, flashY, 6 + t.muzzleFlash*5, 0, Math.PI*2); ctx.fillStyle = `rgba(255,210,80,${t.muzzleFlash})`; ctx.fill();
      }
      ctx.restore(); this.drawTowerOverlay(ctx, t); ctx.restore(); return;
    }

    ctx.fillStyle = def.color; ctx.beginPath(); ctx.ellipse(0, 4, 13, 15, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#d8b08a"; ctx.beginPath(); ctx.arc(0, -12, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = def.color;
    if (t.defKey === "support"){ ctx.fillStyle = "#c84a4a"; ctx.beginPath(); ctx.arc(0, -16, 9, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(-6,-14); ctx.lineTo(-12,-8); ctx.lineTo(-6,-8); ctx.closePath(); ctx.fill(); }
    else if (t.defKey === "sniper"){ ctx.fillStyle = "#4a6b3a"; ctx.beginPath(); ctx.ellipse(0, -16, 13, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -20, 7, Math.PI, 0); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, -17, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(-9, -18, 18, 4); }
    if (t.defKey !== "support"){ ctx.save(); ctx.rotate(t.angle); ctx.translate(-t.recoil*4, 0); ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(22,0); ctx.stroke(); ctx.restore(); }
    this.drawTowerOverlay(ctx, t); ctx.restore();
  }
  drawTowerOverlay(ctx, t){
    if (t.defKey === "mg"){ const heat = clamp(t.heat/TOWER_DEFS.mg.heatMax,0,1); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(-14, -34, 28, 4); ctx.fillStyle = heat > 0.7 ? "#ff4d00" : "#ffd75e"; ctx.fillRect(-14, -34, 28*heat, 4); }
    for (let i=0;i<t.level;i++){ ctx.fillStyle = "#FFCD00"; this.drawStar(ctx, (i - (t.level-1)/2) * 7, -30, 3.5, 5); }
    if (t.stunTimer > 0){ ctx.fillStyle = "#fff"; ctx.font = "14px sans-serif"; ctx.textAlign = "center"; const sp = t.animT*6; ctx.fillText("★", Math.cos(sp)*10, -26 + Math.sin(sp)*4); ctx.fillText("★", Math.cos(sp+2)*10, -26 + Math.sin(sp+2)*4); ctx.fillText("★", Math.cos(sp+4)*10, -26 + Math.sin(sp+4)*4); }
  }
  drawEnemy(ctx, e){
    if (e.dead || e.reachedBase) return;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(e.x, e.y + e.def.r*0.7, e.def.r*1.1, e.def.r*0.45, 0, 0, Math.PI*2); ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fill();
    ctx.translate(e.x, e.y + Math.sin(e.animT*8)*1.2);
    if (e.aura){ ctx.beginPath(); ctx.arc(0,0, e.aura.radius, 0, Math.PI*2); ctx.fillStyle = "rgba(200,60,60,.06)"; ctx.fill(); }
    
    const img = SPRITE_IMGS[e.defKey];
    if (img && img.complete && img.naturalWidth > 0){
      const size = e.def.r * 3.5; ctx.save();
      let flip = 1; if ((e.angle > Math.PI/2 || e.angle < -Math.PI/2)) flip = -1;
      ctx.scale(flip, 1); ctx.drawImage(img, -size/2, -size*0.8, size, size); ctx.restore();
    } else {
      ctx.fillStyle = "#8a6b3a"; ctx.beginPath(); ctx.ellipse(0, 2, e.def.r*0.75, e.def.r*0.9, 0, 0, Math.PI*2); ctx.fill();
    }
    if (e.hitFlash > 0){ ctx.globalAlpha = e.hitFlash*0.6; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, e.def.r*1.2, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; }
    
    const hpw = e.def.r*2.2, hpr = clamp(e.hp/e.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(-hpw/2, -e.def.r - 14, hpw, 4);
    ctx.fillStyle = hpr > 0.5 ? "#4ad04a" : (hpr > 0.25 ? "#ffd75e" : "#ff4d4d"); ctx.fillRect(-hpw/2, -e.def.r - 25, hpw*hpr, 4);
    ctx.restore();
  }
  drawTrap(ctx, tr){
    ctx.save(); ctx.translate(tr.x, tr.y); ctx.scale(1 + Math.sin(tr.animT*4)*0.05, 1 + Math.sin(tr.animT*4)*0.05);
    const img = SPRITE_IMGS["trap"];
    if (img && img.complete && img.naturalWidth > 0){ const size = 36; ctx.drawImage(img, -size/2, -size/2, size, size); }
    else { ctx.beginPath(); ctx.ellipse(0,4,14,6,0,0,Math.PI*2); ctx.fillStyle = "#5a4a2a"; ctx.fill(); }
    ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.font = "bold 11px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.strokeText(tr.uses, 0, 16); ctx.fillText(tr.uses, 0, 16); ctx.restore();
  }
  drawProjectile(ctx, p){
    for (const tr of p.trail){ ctx.globalAlpha = tr.life/0.15 * 0.4; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(tr.x, tr.y, p.size*0.7, 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fillStyle = p.color; ctx.fill();
  }
  drawShell(ctx, s){
    ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI*2); ctx.fillStyle = "#3a2a1a"; ctx.fill(); ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  }
  drawParticle(ctx, p){
    const a = clamp(p.life/p.maxLife, 0, 1); ctx.globalAlpha = a; ctx.fillStyle = p.color;
    if (p.type === "star") this.drawStar(ctx, p.x, p.y, p.size, 5);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.shrink ? p.size * a : p.size), 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  drawDamageText(ctx, d){
    const a = clamp(d.life/d.max, 0, 1); ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#8e0b20"; ctx.lineWidth = 3; ctx.font = "bold 14px 'Be Vietnam Pro', sans-serif"; ctx.textAlign = "center";
    ctx.strokeText(d.text, d.x, d.y); ctx.fillText(d.text, d.x, d.y); ctx.globalAlpha = 1;
  }
  drawStar(ctx, cx, cy, r, n){
    ctx.beginPath(); for (let i=0;i<n*2;i++){ const rad = i%2===0 ? r : r*0.45, ang = -Math.PI/2 + i*Math.PI/n; const px = cx + Math.cos(ang)*rad, py = cy + Math.sin(ang)*rad; if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.fill();
  }
  drawSunRays(ctx){
    if (this.timeOfDay === "night") return;
    ctx.save(); ctx.globalAlpha = 0.055; const t = this.ambientT*0.1;
    for (let i=0;i<6;i++){ const x = (i*300 + t*100) % (MAP_W+400) - 200; ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x+80, MAP_H+100); ctx.lineTo(x+140, MAP_H+100); ctx.lineTo(x+60, -100); ctx.closePath(); ctx.fillStyle = this.timeOfDay==="dusk" ? "#ffa040" : "#fff8c0"; ctx.fill(); }
    ctx.restore();
  }
  drawLeaves(ctx){
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let i=0;i<14;i++){ const x = (i*137 + this.leafT*20*(1+i%3)) % (MAP_W+100) - 50; const y = (i*89 + this.leafT*30) % (MAP_H+100) - 50; ctx.beginPath(); ctx.ellipse(x, y, 5, 2, Math.sin(this.leafT+i)*0.8, 0, Math.PI*2); ctx.fillStyle = i%3===0 ? "#c84a2a" : (i%3===1 ? "#8aa83a" : "#a8843a"); ctx.fill(); }
    ctx.restore();
  }
  drawBirds(ctx){
    if (this.timeOfDay === "night") return;
    ctx.save(); ctx.strokeStyle = "rgba(40,30,20,.55)"; ctx.lineWidth = 2;
    for (const b of this.birds){ const wing = Math.sin(b.ph)*4; ctx.beginPath(); ctx.moveTo(b.x-6, b.y+wing); ctx.quadraticCurveTo(b.x-2, b.y-2, b.x, b.y); ctx.quadraticCurveTo(b.x+2, b.y-2, b.x+6, b.y+wing); ctx.stroke(); }
    ctx.restore();
  }
  drawFireflies(ctx){
    ctx.save(); for (const f of this.fireflies){ const a = 0.4 + Math.sin(f.t*3)*0.4; ctx.globalAlpha = a; ctx.fillStyle = "#ffe9a0"; ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = a*0.3; ctx.beginPath(); ctx.arc(f.x, f.y, 7, 0, Math.PI*2); ctx.fill(); } ctx.restore();
  }
  drawVignette(ctx){
    const g = ctx.createRadialGradient(MAP_W/2, MAP_H/2, Math.min(MAP_W, MAP_H)*0.35, MAP_W/2, MAP_H/2, Math.max(MAP_W, MAP_H)*0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(20,10,0,0.35)");
    ctx.fillStyle = g; ctx.fillRect(-200,-200,MAP_W+400,MAP_H+400);
  }
}

/* ==================== UI HELPERS ==================== */
function showOverlay(id){ document.getElementById(id).classList.remove("hidden"); }
function hideOverlay(id){ document.getElementById(id).classList.add("hidden"); }
function hideAllOverlays(){ ["menuOverlay","modeOverlay","guideOverlay","pauseOverlay","endOverlay"].forEach(id=>hideOverlay(id)); }

/* ==================== KHỞI TẠO & SỰ KIỆN UI ==================== */
(function main(){
  const canvas = document.getElementById("game");
  const game = new Game(canvas);
  window.currentGame = game;
  game.start();

  document.getElementById("btnOpenModes").addEventListener("click", ()=>{
    hideOverlay("menuOverlay");
    showOverlay("modeOverlay");
  });

  document.getElementById("btnBackToMenu").addEventListener("click", ()=>{
    hideOverlay("modeOverlay");
    showOverlay("menuOverlay");
  });

  const startGame = (mode) => {
    AudioSys.init(); AudioSys.resume(); hideAllOverlays(); 
    game.mode = mode; game.reset(); game.startPrep(); game.state = "PREP"; 
    AudioSys.startMusicLoop(); game.updateHUD(); 
  };

  document.getElementById("cardEasy").addEventListener("click", ()=>startGame("easy"));
  document.getElementById("cardHard").addEventListener("click", ()=>startGame("hard"));
  document.getElementById("cardEndless").addEventListener("click", ()=>startGame("endless"));

  document.getElementById("btnGuide").addEventListener("click", ()=>showOverlay("guideOverlay"));
  document.getElementById("btnGuideClose").addEventListener("click", ()=>hideOverlay("guideOverlay"));
  
  document.getElementById("btnPause").addEventListener("click", ()=>{ if (game.state === "PAUSED") game.togglePause(); else if (game.state === "PREP" || game.state === "WAVE") game.pauseGame(); });
  document.getElementById("btnSpeed").addEventListener("click", ()=>{ game.speedMul = game.speedMul === 1 ? 2 : 1; document.getElementById("btnSpeed").textContent = "x" + game.speedMul; document.getElementById("btnSpeed").classList.toggle("on", game.speedMul === 2); });
  
  // Đã ẩn nút SFX vì âm thanh giờ do bạn tự quản lý
  const btnSfx = document.getElementById("btnSfx");
  if(btnSfx) btnSfx.style.display = "none"; 
  
  document.getElementById("btnMusic").addEventListener("click", ()=>{ const on = AudioSys.toggleMusic(); document.getElementById("btnMusic").classList.toggle("on", on); });

  document.getElementById("btnResume").addEventListener("click", ()=>{ hideOverlay("pauseOverlay"); game.state = game._pausedState || "WAVE"; AudioSys.setAmbient(game.timeOfDay === "night" ? "night" : "day"); });
  document.getElementById("btnRestartPause").addEventListener("click", ()=>{ hideAllOverlays(); game.reset(); game.startPrep(); game.state = "PREP"; AudioSys.startMusicLoop(); game.updateHUD(); });
  document.getElementById("btnMenuPause").addEventListener("click", ()=>{ hideAllOverlays(); showOverlay("menuOverlay"); game.state = "MENU"; AudioSys.stopMusicLoop(); AudioSys.setAmbient(""); });
  
  document.getElementById("btnReplay").addEventListener("click", ()=>{ hideAllOverlays(); game.reset(); game.startPrep(); game.state = "PREP"; AudioSys.startMusicLoop(); game.updateHUD(); });
  document.getElementById("btnMenuEnd").addEventListener("click", ()=>{ hideAllOverlays(); showOverlay("menuOverlay"); game.state = "MENU"; AudioSys.stopMusicLoop(); AudioSys.setAmbient(""); });

  /* ==========================================
     ADMIN PANEL LOGIC
  ========================================== */
  const adminPanel = document.getElementById("adminPanel");
  const adminHeader = document.getElementById("adminHeader");
  
  window.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") {
      if (adminPanel.style.display === "none") adminPanel.style.display = "block";
      else adminPanel.style.display = "none";
    }
  });

  let isDraggingAdmin = false, offsetX = 0, offsetY = 0;
  adminHeader.addEventListener('mousedown', (e) => { 
    isDraggingAdmin = true; 
    offsetX = e.clientX - adminPanel.getBoundingClientRect().left; 
    offsetY = e.clientY - adminPanel.getBoundingClientRect().top; 
    adminHeader.style.cursor = 'grabbing'; 
  });
  document.addEventListener('mousemove', (e) => { 
    if (!isDraggingAdmin) return; 
    let newLeft = e.clientX - offsetX, newTop = e.clientY - offsetY; 
    const maxX = window.innerWidth - adminPanel.offsetWidth, maxY = window.innerHeight - adminPanel.offsetHeight; 
    newLeft = Math.max(0, Math.min(newLeft, maxX)); 
    newTop = Math.max(0, Math.min(newTop, maxY)); 
    adminPanel.style.right = 'auto'; 
    adminPanel.style.left = newLeft + 'px'; 
    adminPanel.style.top = newTop + 'px'; 
  });
  document.addEventListener('mouseup', () => { 
    isDraggingAdmin = false; 
    adminHeader.style.cursor = 'move'; 
  });

  document.getElementById("btnAddFood").addEventListener("click", () => {
    if (window.currentGame) { window.currentGame.food += 1000; window.currentGame.updateHUD(); }
  });
  document.getElementById("btnSetFood").addEventListener("click", () => {
    const val = parseInt(document.getElementById("inputFood").value);
    if (window.currentGame && !isNaN(val)) { window.currentGame.food = val; window.currentGame.updateHUD(); }
  });

  const changeTime = (timeStr) => {
    if (window.currentGame) {
      if (window.currentGame.timeOfDay !== timeStr) {
        window.currentGame.prevTimeOfDay = window.currentGame.timeOfDay;
        window.currentGame.timeOfDay = timeStr;
        window.currentGame.bgAlpha = 0; 
        AudioSys.setAmbient(timeStr === "night" ? "night" : "day");
      }
    }
  };
  document.getElementById("btnTimeDay").addEventListener("click", () => changeTime("day"));
  document.getElementById("btnTimeDusk").addEventListener("click", () => changeTime("dusk"));
  document.getElementById("btnTimeNight").addEventListener("click", () => changeTime("night"));

  const jumpToWave = (waveNum) => {
    if (!window.currentGame) return;
    const wIdx = Math.max(0, waveNum - 1); 
    const g = window.currentGame;
    
    g.enemies = []; g.spawnQueue = []; g.boss = null; g.bossSpawned = false;
    document.getElementById("bossBarWrap").classList.remove("show");
    
    g.waveIndex = wIdx;
    g.startWave(); 
    g.state = "WAVE"; 
  };

  document.getElementById("btnNextWave").addEventListener("click", () => {
    if (window.currentGame) jumpToWave(window.currentGame.waveIndex + 1);
  });
  document.getElementById("btnSetWave").addEventListener("click", () => {
    const val = parseInt(document.getElementById("inputWave").value);
    if (!isNaN(val)) jumpToWave(val);
  });

  document.getElementById("btnWinGame").addEventListener("click", () => {
    if (window.currentGame) window.currentGame.gameOver(true);
  });

  adminPanel.style.right = "10px";
  adminPanel.style.top = "10px";

  game.updateHUD();
})();