// VARIÁVEIS TIPO 'LET' PARA COMPATIBILIDADE MOBILE
let moedas = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nomeUsuario = localStorage.getItem('nickname') || "";
let listaRanking = JSON.parse(localStorage.getItem('leaderboard')) || [];
let ferramenta = null;

const telas = { 
    menu: document.getElementById('main-menu'), 
    rank: document.getElementById('rank-tab'),
    editor: document.getElementById('level-editor')
};

// ATUALIZAR INTERFACE
function atualizarTELA() {
    const txtMoedas = document.getElementById('coin-value');
    const txtNome = document.getElementById('user-name');
    
    if(txtMoedas) txtMoedas.innerText = moedas;
    if(txtNome) {
        txtNome.innerHTML = nomeUsuario || "...";
        if (nomeUsuario === "Bolacha") {
            txtNome.innerHTML += ' <span class="badge-dono">DONO</span>';
        }
    }
    localStorage.setItem('coins', moedas);
}

function mudarTela(alvo) {
    Object.values(telas).forEach(t => { if(t) t.classList.add('hidden'); });
    if(alvo) alvo.classList.remove('hidden');
}

// CRIAR GRADE DO MAPA
function criarGrade() {
    const grade = document.getElementById('grid-canvas');
    if(!grade) return;
    grade.innerHTML = '<div id="player" class="hidden"></div>'; 
    
    for (let i = 0; i < 300; i++) {
        const bloco = document.createElement('div');
        bloco.className = 'cell';
        bloco.onclick = function() {
            let custo = (ferramenta === 'block' || ferramenta === 'lava') ? 5 : 0;
            if (ferramenta === 'sell') {
                if (bloco.classList.contains('block') || bloco.classList.contains('lava')) moedas += 5;
                bloco.className = 'cell';
            } else if (ferramenta && moedas >= custo) {
                if (ferramenta === 'spawn' || ferramenta === 'flag') {
                    const antigo = document.querySelector('.cell.' + ferramenta);
                    if(antigo) antigo.classList.remove(ferramenta);
                }
                bloco.className = 'cell ' + ferramenta;
                moedas -= custo;
            }
            atualizarTELA();
        };
        grade.appendChild(bloco);
    }
}

// INICIALIZAÇÃO
window.onload = function() {
    atualizarTELA();
    
    // Botão Criar
    const btnCriar = document.getElementById('btn-create');
    if(btnCriar) btnCriar.onclick = function() {
        criarGrade();
        mudarTela(telas.editor);
    };

    // Botão Ranking
    const btnRank = document.getElementById('btn-rank');
    if(btnRank) btnRank.onclick = function() {
        const listaHTML = document.getElementById('rank-list');
        if(listaHTML) {
            listaHTML.innerHTML = listaRanking.sort((a,b) => b.coins - a.coins).slice(0,5).map((u, i) => 
                `<div style="padding:10px; border-bottom:1px solid #333;">#${i+1} ${u.name} - 💰 ${u.coins}</div>`
            ).join('');
        }
        mudarTela(telas.rank);
    };

    document.getElementById('btn-back-rank').onclick = () => mudarTela(telas.menu);

    // Seleção de Ferramentas
    document.querySelectorAll('.tool').forEach(t => {
        t.onclick = function() {
            document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            ferramenta = this.dataset.type;
        };
    });

    // Nickname
    document.getElementById('btn-save-nick').onclick = function() {
        const input = document.getElementById('nick-input');
        if(input && input.value.length >= 2) {
            nomeUsuario = input.value.trim();
            localStorage.setItem('nickname', nomeUsuario);
            document.getElementById('nick-modal').classList.add('hidden');
            atualizarTELA();
        }
    };
};
