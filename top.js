const screens = { menu: document.getElementById('main-menu'), comm: document.getElementById('community-tab'), editor: document.getElementById('level-editor') };
const mobileControls = document.getElementById('mobile-controls');

let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let communityLevels = JSON.parse(localStorage.getItem('communityLevels')) || [];

let isPlaying = false;
let px = 0, py = 0, vx = 0, vy = 0;
const gravity = 0.5, jump = -10, speed = 4;
const keys = {};
let collisionMap = [];
let selectedTool = null;

// --- CONTROLES ---
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
    document.getElementById('coin-value').innerText = coins;
    document.getElementById('user-name').innerText = nickname || "...";
    localStorage.setItem('coins', coins);
    localStorage.setItem('communityLevels', JSON.stringify(communityLevels));
    
    const adminBtn = document.getElementById('admin-panel-btn');
    if (nickname === "Bolacha") adminBtn.classList.remove('hidden');
    else adminBtn.classList.add('hidden');
}

// --- ADMIN ---
function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }
document.getElementById('admin-panel-btn').onclick = () => document.getElementById('admin-modal').classList.remove('hidden');
function adminAddCoins() { coins += 1000; updateUI(); }
function adminClearLevels() { if(confirm("Apagar tudo?")) { communityLevels = []; updateUI(); location.reload(); } }

// --- NAVEGAÇÃO ---
function navigate(target) {
    isPlaying = false;
    document.getElementById('player').classList.add('hidden');
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    target.classList.remove('hidden');
    
    if(target === screens.editor) {
        mobileControls.classList.remove('hidden');
        document.getElementById('editor-sidebar').style.display = 'flex';
    } else {
        mobileControls.classList.add('hidden');
    }
}

document.getElementById('btn-create').onclick = () => { initGrid(); navigate(screens.editor); };
document.getElementById('btn-play').onclick = () => { renderComm(); navigate(screens.comm); };
document.getElementById('btn-back-comm').onclick = () => navigate(screens.menu);

// --- EDITOR ---
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
    canvas.innerHTML = ''; 
    canvas.appendChild(player); 
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
                        coins -= cost;
                        cell.className = 'cell ' + selectedTool;
                    }
                } else { alert("Sem moedas!"); }
            }
            updateUI();
        };
        canvas.appendChild(cell);
    }
}

// --- FUNÇÃO DE PUBLICAR CORRIGIDA ---
document.getElementById('publish-btn').addEventListener('click', function() {
    const spawnExists = document.querySelector('.cell.spawn');
    const flagExists = document.querySelector('.cell.flag');

    if (!spawnExists) return alert("ERRO: Coloque um SPAWN (Personagem)!");
    if (!flagExists) return alert("ERRO: Coloque uma META (Bandeira)!");

    // Captura os dados de todas as células
    const allCells = document.querySelectorAll('.cell');
    const mapData = [];
    allCells.forEach(cell => {
        mapData.push(cell.className);
    });

    // Salva no array global
    communityLevels.push({
        author: nickname,
        map: mapData
    });

    // Atualiza o Banco de Dados (LocalStorage)
    localStorage.setItem('communityLevels', JSON.stringify(communityLevels));
    
    alert("NÍVEL PUBLICADO COM SUCESSO!");
    updateUI(); 
    navigate(screens.menu);
});

// --- JOGO ---
function renderComm() {
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    communityLevels.forEach((l, i) => {
        const d = document.createElement('div');
        d.innerHTML = `<div style="background:#1a1a3a; padding:15px; border-radius:10px; border:1px solid var(--primary); text-align:center; cursor:pointer; color:white;">NÍVEL ${i+1}<br><small>Por: ${l.author}</small></div>`;
        d.onclick = () => startLevel(l);
        list.appendChild(d);
    });
}

function startLevel(level) {
    navigate(screens.editor);
    document.getElementById('editor-sidebar').style.display = 'none';
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    canvas.innerHTML = ''; 
    canvas.appendChild(player);
    
    collisionMap = level.map;
    collisionMap.forEach(cls => {
        const c = document.createElement('div');
        c.className = cls;
        canvas.appendChild(c);
    });

    const spawnIdx = collisionMap.findIndex(c => c.includes('spawn'));
    px = (spawnIdx % 20) * 32 + 6; 
    py = Math.floor(spawnIdx / 20) * 32;
    vx = 0; vy = 0; 
    player.classList.remove('hidden');
    isPlaying = true; 
    requestAnimationFrame(loop);
}

function loop() {
    if (!isPlaying) return;
    vx = (keys['ArrowLeft'] || keys['KeyA']) ? -speed : (keys['ArrowRight'] || keys['KeyD']) ? speed : 0;
    
    px += vx;
    if (checkCollision(px, py)) px -= vx;

    vy += gravity; if (vy > 10) vy = 10;
    py += vy;
    if (checkCollision(px, py)) {
        if (vy > 0) {
            py = Math.floor((py + 26) / 32) * 32 - 26; vy = 0;
            if (keys['ArrowUp'] || keys['KeyW'] || keys['Space']) vy = jump;
        } else { py = Math.ceil(py / 32) * 32; vy = 0; }
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
    return pts.some(p => {
        const c = Math.floor(p.x/32), r = Math.floor(p.y/32);
        return collisionMap[r*20+c]?.includes('block');
    });
}
