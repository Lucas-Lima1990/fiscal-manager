document.addEventListener('DOMContentLoaded', () => {
    let obligations = JSON.parse(localStorage.getItem('minhasObrigacoes')) || [];

    // --- MÁSCARA DE DATA ---
    const applyMask = (el) => {
        if(!el) return;
        el.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g,"");
            if(v.length > 8) v = v.slice(0,8);
            if(v.length >= 5) v = v.replace(/^(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
            else if(v.length >= 3) v = v.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
            e.target.value = v;
        });
    };
    applyMask(document.getElementById('dateInput'));
    applyMask(document.getElementById('emailDateInput'));

    function parseDate(s) {
        if(!s) return new Date(0);
        const b = s.split('/');
        return new Date(b[2], b[1]-1, b[0]);
    }

    // --- NAVEGAÇÃO ---
    window.showSection = (s, e) => {
        const sections = ['viewSection','addSection','historySection','reportsSection'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
        const target = document.getElementById(s + 'Section');
        if(target) target.style.display = 'block';
        
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        if(e) e.currentTarget.classList.add('active');
        
        renderData();
        if(s === 'reports') generateReports();
    };

    // --- RENDERIZAÇÃO ---
    function renderData() {
        const grid = document.getElementById('cardsGrid');
        const hist = document.getElementById('historyGrid');
        if(grid) grid.innerHTML = ''; 
        if(hist) hist.innerHTML = '';
        
        obligations.sort((a,b) => parseDate(a.date) - parseDate(b.date));
        
        obligations.forEach((item, i) => {
            const html = createCard(item, i);
            if(item.completed) {
                if(hist) hist.insertAdjacentHTML('beforeend', html);
            } else {
                if(grid) grid.insertAdjacentHTML('beforeend', html);
            }
        });
        localStorage.setItem('minhasObrigacoes', JSON.stringify(obligations));
    }

    function createCard(item, i) {
        const today = new Date(); today.setHours(0,0,0,0);
        const due = parseDate(item.date);
        const diff = Math.ceil((due - today) / (1000*60*60*24));
        
        let colorClass = 'border-success', bClass = 'success-badge', bText = 'No Prazo';
        
        if(item.completed) {
            colorClass = 'border-success'; bText = 'Concluído';
        } else if(diff < 0) {
            colorClass = 'border-urgent'; bClass = 'urgent-badge'; bText = 'Atrasado';
        } else if(diff <= 5) {
            colorClass = 'border-warning'; bClass = 'warning-badge'; bText = `Vence em ${diff} dias`;
        }

        return `
        <div class="card-wrapper ${colorClass}">
            <div class="card">
                <div class="card-company">${item.company}</div>
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <span class="card-title">${item.name}</span>
                    <input type="checkbox" ${item.completed ? 'checked' : ''} onclick="toggleTask(${i})">
                </div>
                <div style="font-size:13px; color:#444">
                    Vencimento: <b>${item.date}</b><br>
                    E-mail: ${item.emailDate || '---'}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px">
                    <span class="status-badge ${item.completed ? 'success-badge' : bClass}">${bText}</span>
                    <button onclick="deleteTask(${i})" style="border:none; background:none; cursor:pointer; color:#888">
                        <span class="material-icons-round" style="font-size:18px">delete</span>
                    </button>
                </div>
            </div>
        </div>`;
    }

    window.filterHistory = () => {
        const term = document.getElementById('searchInput').value.toLowerCase();
        const month = document.getElementById('monthSelect').value;
        const hist = document.getElementById('historyGrid');
        if(!hist) return;
        hist.innerHTML = '';
        obligations.forEach((item, i) => {
            if(!item.completed) return;
            const mMatch = month === 'all' || item.date.split('/')[1] === month;
            const tMatch = item.company.toLowerCase().includes(term) || item.name.toLowerCase().includes(term);
            if(mMatch && tMatch) hist.insertAdjacentHTML('beforeend', createCard(item, i));
        });
    };

    window.toggleTask = i => { obligations[i].completed = !obligations[i].completed; renderData(); };
    window.deleteTask = i => { if(confirm("Excluir?")) { obligations.splice(i,1); renderData(); } };

    const addBtn = document.getElementById('addBtn');
    if(addBtn) {
        addBtn.onclick = () => {
            const c = document.getElementById('companyInput'), n = document.getElementById('taskInput'), d = document.getElementById('dateInput'), e = document.getElementById('emailDateInput');
            if(c.value && n.value && d.value.length === 10) {
                obligations.push({ company: c.value.toUpperCase(), name: n.value.toUpperCase(), date: d.value, emailDate: e.value, completed: false });
                c.value = ''; n.value = ''; d.value = ''; e.value = '';
                showSection('view');
            } else alert("Preencha Empresa, Obrigação e Data!");
        };
    }

    function generateReports() {
        const pending = obligations.filter(o => !o.completed).length;
        const urgent = obligations.filter(o => {
            const d = parseDate(o.date);
            const today = new Date(); today.setHours(0,0,0,0);
            const diff = Math.ceil((d - today) / (1000*60*60*24));
            return !o.completed && diff <= 5;
        }).length;
        const done = obligations.filter(o => o.completed).length;

        const pEl = document.getElementById('countPending');
        const uEl = document.getElementById('countUrgent');
        const dEl = document.getElementById('countDone');
        
        if(pEl) pEl.innerText = pending;
        if(uEl) uEl.innerText = urgent;
        if(dEl) dEl.innerText = done;
    }

    // --- FUNÇÃO DO SPOTIFY CORRIGIDA (HTTPS) ---
    window.changePlaylist = (playlistId, event) => {
        const player = document.getElementById('spotify-player');
        if (!player) return;

        // Criando a URL corretamente com HTTPS e o formato de EMBED
        const newSrc = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
        
        // Atribui ao player
        player.src = newSrc;

        // Atualiza os botões ativos
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (event) event.currentTarget.classList.add('active');
    };

    renderData();
});