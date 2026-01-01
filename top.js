// === 1. CONFIGURAÇÕES GERAIS ===
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

// === 2. FUNÇÕES DE INTERFACE E NAVEGAÇÃO ===
function updateUI() {
    const coinSpan = document.getElementById('coin-value');
    const nameSpan = document.getElementById('user-name');
    if(coinSpan) coinSpan.innerText = coins;
    if(nameSpan) {
        nameSpan.innerHTML = nickname || "...";
        if (nickname === "Bolacha") {
            nameSpan.innerHTML += ' <span class="badge-dono">DONO</span>';
            document.getElementById('admin-panel-btn')?.classList.remove('hidden');
        }
    }
    localStorage.setItem('coins', coins);
}

function navigate(target) {
    if(!target) return;
    isPlaying = false;
    document.getElementById('player').classList.add('hidden');
    Object.values(screens).forEach(s => s?.classList.add('hidden'));
    target.classList.remove('hidden');
    
    if(target === screens.editor) {
        mobileControls?.classList.remove('hidden');
        document.getElementById('editor-sidebar').style.display = 'flex';
    } else {
        mobileControls?.classList.add('hidden');
    }
}

// === 3. LÓGICA DO EDITOR (CRIAR MAPA) ===
function initGrid() {
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    if(!canvas) return;
    
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

// === 4. INICIALIZAÇÃO AO CARREGAR ===
window.onload = () => {
    console.log("Iniciando scripts do jogo...");
    updateUI();
    if (!nickname) document.getElementById('nick-modal')?.classList.remove('hidden');

    // Botão Jogar
    document.getElementById('btn-play').onclick = () => { renderComm(); navigate(screens.comm); };
    
    // Botão Criar (Este é o que ativa o mapa)
    document.getElementById('btn-create').onclick = () => { 
        initGrid(); 
        navigate(screens.editor); 
    };

    // Botão Ranking
    document.getElementById('btn-rank').onclick = () => {
        const list = document.getElementById('rank-list');
        if(list) {
            list.innerHTML = '';
            leaderboard.sort((a,b) => b.coins - a.coins).slice(0,10).forEach((u, i) => {
                const item = document.createElement('div');
                item.style = "background:rgba(20,20,50,0.8); padding:10px; margin:5px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid #00f2ff;";
                item.innerHTML = `<span>#${i+1} ${u.name}</span> <span>💰 ${u.coins}</span>`;
                list.appendChild(item);
            });
        }
        navigate(screens.rank);
    };

    // Botões Voltar
    document.getElementById('btn-back-rank').onclick = () => navigate(screens.menu);
    document.getElementById('btn-back-comm').onclick = () => navigate(screens.menu);

    // Salvar Nick
    document.getElementById('btn-save-nick').onclick = () => {
        const val = document.getElementById('nick-input').value.trim();
        if (val.length >= 2) {
            nickname = val;
            localStorage.setItem('nickname', nickname);
            document.getElementById('nick-modal').classList.add('hidden');
            updateUI();
        }
    };

    // Publicar Nível
    document.getElementById('publish-btn').onclick = () => {
        const s = document.querySelector('.cell.spawn'), f = document.querySelector('.cell.flag');
        if (!s || !f) return alert("Coloque Spawn e Meta!");
        const mapData = Array.from(document.querySelectorAll('.cell')).map(c => c.className);
        communityLevels.push({ author: nickname, map: mapData });
        localStorage.setItem('communityLevels', JSON.stringify(communityLevels));
        alert("Nível Publicado!"); 
        navigate(screens.menu);
    };

    // Ferramentas do Editor (Clica no BLOCO, LAVA, etc)
    document.querySelectorAll('.tool').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
            t.classList.add('active');
            selectedTool = t.dataset.type;
        };
    });
};

// === 5. SISTEMA DE JOGO E FÍSICA ===
function renderComm() {
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    communityLevels.forEach((l, i) => {
        const d = document.createElement('div');
        d.innerHTML = `<div style="background:#1a1a3a; padding:15px; border-radius:10px; border:1px solid #00f2ff; text-align:center; cursor:pointer;">NÍVEL ${i+1}<br><small>Por: ${l.author}</small></div>`;
        d.onclick = () => startLevel(l);
        list.appendChild(d);
    });
}

function startLevel(level) {
    navigate(screens.editor);
    document.getElementById('editor-sidebar').style.display = 'none';
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
    if (tile && tile.includes('lava')) { isPlaying = false; alert("MORREU!"); navigate(screens.menu); return; }
    if (tile && tile.includes('flag')) { isPlaying = false; coins += 50; updateUI(); alert("VENCEU! +50"); navigate(screens.menu); return; }
    if (py > 480) navigate(screens.menu);
    document.getElementById('player').style.transform = `translate(${px}px, ${py}px)`;
    requestAnimationFrame(loop);
}

function checkCollision(x, y) {
    const pts = [{x:x+6, y:y+2}, {x:x+14, y:y+2}, {x:x+6, y:y+25}, {x:x+14, y:y+25}];
    return pts.some(p => { const c = Math.floor(p.x/32), r = Math.floor(p.y/32); return collisionMap[r*20+c]?.includes('block'); });
}

window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;
