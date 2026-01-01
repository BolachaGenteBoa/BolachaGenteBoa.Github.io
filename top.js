const screens = { 
    menu: document.getElementById('main-menu'), 
    comm: document.getElementById('community-tab'), 
    editor: document.getElementById('level-editor'),
    rank: document.getElementById('rank-tab')
};
const mobileControls = document.getElementById('mobile-controls');

let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let communityLevels = JSON.parse(localStorage.getItem('communityLevels')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

let isPlaying = false;
let px = 0, py = 0, vx = 0, vy = 0;
const gravity = 0.5, jump = -10, speed = 4;
const keys = {};
let collisionMap = [];
let selectedTool = null;

// CONTROLES
window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

function setupMobile(id, key) {
    const btn = document.getElementById(id);
    btn.ontouchstart = (e) => { e.preventDefault(); keys[key] = true; };
    btn.ontouchend = (e) => { e.preventDefault(); keys[key] = false; };
}
setupMobile('btn-left', 'ArrowLeft');
setupMobile('btn-right', 'ArrowRight');
setupMobile('btn-jump', 'ArrowUp');

window.onload = () => { updateUI(); if (!nickname) document.getElementById('nick-modal').classList.remove('hidden'); };

document.getElementById('btn-save-nick').onclick = () => {
    nickname = document.getElementById('nick-input').value.trim();
    if (nickname.length < 2) return alert("Nick muito curto!");
    localStorage.setItem('nickname', nickname);
    document.getElementById('nick-modal').classList.add('hidden');
    updateUI();
};

function updateUI() {
    const coinSpan = document.getElementById('coin-value');
    const nameSpan = document.getElementById('user-name');
    
    coinSpan.innerText = coins;
    nameSpan.innerHTML = nickname || "...";

    // CARGO DONO E ADMIN
    const adminBtn = document.getElementById('admin-panel-btn');
    if (nickname === "Bolacha") {
        nameSpan.innerHTML += ' <span class="badge-dono">DONO</span>';
        adminBtn.classList.remove('hidden');
    } else {
        adminBtn.classList.add('hidden');
    }

    localStorage.setItem('coins', coins);
    localStorage.setItem('communityLevels', JSON.stringify(communityLevels));
    
    // Atualiza Ranking Local
    if(nickname) {
        let user = leaderboard.find(u => u.name === nickname);
        if(user) user.coins = coins; else leaderboard.push({name: nickname, coins: coins});
        leaderboard.sort((a,b) => b.coins - a.coins);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

// RANKING
document.getElementById('btn-rank').onclick = () => {
    const list = document.getElementById('rank-list');
    list.innerHTML = '';
    leaderboard.forEach((u, i) => {
        const item = document.createElement('div');
        item.style = "background:rgba(0,0,0,0.3); padding:12px; margin-bottom:8px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid #333;";
        let dono = u.name === "Bolacha" ? '<span class="badge-dono">DONO</span>' : '';
        item.innerHTML = `<span>#${i+1} <strong>${u.name}</strong>${dono}</span> <span>💰 ${u.coins}</span>`;
        list.appendChild(item);
    });
    navigate(screens.rank);
};
document.getElementById('btn-back-rank').onclick = () => navigate(screens.menu);

// ADMIN
document.getElementById('admin-panel-btn').onclick = () => document.getElementById('admin-modal').classList.remove('hidden');
function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }
function adminAddCoins() { coins += 1000; updateUI(); }
function adminClearLevels() { if(confirm("Apagar tudo?")) { communityLevels = []; updateUI(); location.reload(); } }

function navigate(target) {
    isPlaying = false;
    document.getElementById('player').classList.add('hidden');
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    target.classList.remove('hidden');
    if(target === screens.editor) {
        mobileControls.classList.remove('hidden');
        document.getElementById('editor-sidebar').style.display = 'flex';
    } else { mobileControls.classList.add('hidden'); }
}

// EDITOR E JOGO (MESMA LÓGICA ANTERIOR MAS REVISADA)
document.getElementById('btn-create').onclick = () => { initGrid(); navigate(screens.editor); };
document.getElementById('btn-play').onclick = () => { renderComm(); navigate(screens.comm); };
document.getElementById('btn-back-comm').onclick = () => navigate(screens.menu);

document.querySelectorAll('.tool').forEach(t => {
    t.onclick = () => {
        document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
        t.classList.add('active');
        selectedTool = t.dataset.type;
    };
});

function initGrid() {
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    canvas.innerHTML = ''; canvas.appendChild(player);
    for (let i = 0; i < 300; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.onclick = () => {
            if (isPlaying) return;
            const cost = (selectedTool === 'block' || selectedTool === 'lava') ? 5 : 0;
            if (selectedTool === 'sell') {
                if (cell.classList.contains('block') || cell.classList.contains('lava')) coins += 5;
                cell.className = 'cell';
            } else if (selectedTool) {
                if (coins >= cost) {
                    if (selectedTool === 'spawn' || selectedTool === 'flag') {
                        const old = document.querySelector(`.cell.${selectedTool}`);
                        if (old) old.className = 'cell';
                    }
                    if (!cell.classList.contains(selectedTool)) {
                        coins -= cost; cell.className = 'cell ' + selectedTool;
                    }
                } else { alert("Sem moedas!"); }
            }
            updateUI();
        };
        canvas.appendChild(cell);
    }
}

document.getElementById('publish-btn').addEventListener('click', function() {
    const s = document.querySelector('.cell.spawn'), f = document.querySelector('.cell.flag');
    if (!s || !f) return alert("Coloque Spawn e Meta!");
    const mapData = Array.from(document.querySelectorAll('.cell')).map(c => c.className);
    communityLevels.push({ author: nickname, map: mapData });
    updateUI(); alert("Publicado!"); navigate(screens.menu);
});

function renderComm() {
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    communityLevels.forEach((l, i) => {
        const d = document.createElement('div');
        d.innerHTML = `<div style="background:#1a1a3a; padding:15px; border-radius:10px; border:1px solid var(--primary); text-align:center; cursor:pointer;">NÍVEL ${i+1}<br><small>Por: ${l.author}</small></div>`;
        d.onclick = () => startLevel(l);
        list.appendChild(d);
    });
}

function startLevel(level) {
    navigate(screens.editor); document.getElementById('editor-sidebar').style.display = 'none';
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    canvas.innerHTML = ''; canvas.appendChild(player);
    collisionMap = level.map;
    collisionMap.forEach(cls => { const c = document.createElement('div'); c.className = cls; canvas.appendChild(c); });
    const spawnIdx = collisionMap.findIndex(c => c.includes('spawn'));
    px = (spawnIdx % 20) * 32 + 6; py = Math.floor(spawnIdx / 20) * 32;
    vx = 0; vy = 0; player.classList.remove('hidden');
    isPlaying = true; requestAnimationFrame(loop);
}

function loop() {
    if (!isPlaying) return;
    vx = (keys['ArrowLeft'] || keys['KeyA']) ? -speed : (keys['ArrowRight'] || keys['KeyD']) ? speed : 0;
    px += vx; if (checkCollision(px, py)) px -= vx;
    vy += gravity; if (vy > 10) vy = 10;
    py += vy;
    if (checkCollision(px, py)) {
        if (vy > 0) { py = Math.floor((py + 26) / 32) * 32 - 26; vy = 0; if (keys['ArrowUp'] || keys['KeyW'] || keys['Space']) vy = jump; }
        else { py = Math.ceil(py / 32) * 32; vy = 0; }
    }
    const col = Math.floor((px + 10) / 32), row = Math.floor((py + 13) / 32);
    const tile = collisionMap[row * 20 + col];
    if (tile && tile.includes('lava')) { isPlaying = false; alert("DERROTA!"); navigate(screens.menu); return; }
    if (tile && tile.includes('flag')) { isPlaying = false; coins += 50; updateUI(); alert("VITÓRIA!"); navigate(screens.menu); return; }
    if (py > 480) navigate(screens.menu);
    document.getElementById('player').style.transform = `translate(${px}px, ${py}px)`;
    requestAnimationFrame(loop);
}

function checkCollision(x, y) {
    const pts = [{x:x+6, y:y+2}, {x:x+14, y:y+2}, {x:x+6, y:y+25}, {x:x+14, y:y+25}];
    return pts.some(p => { const c = Math.floor(p.x/32), r = Math.floor(p.y/32); return collisionMap[r*20+c]?.includes('block'); });
}
