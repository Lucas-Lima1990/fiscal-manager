// 1. Bloqueia o acesso se não estiver logado
if (sessionStorage.getItem('logado') !== 'true') {
    window.location.href = "login.html";
}

// 2. Função para deslogar
function logout() {
    sessionStorage.removeItem('logado');
    window.location.href = "login.html";
}

// Variavel global para as obrigações
let obligations = JSON.parse(localStorage.getItem('minhasObrigacoes')) || [];

document.addEventListener('DOMContentLoaded', () => {
    
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
    applyMask(document.getElementById('editDateInput'));
    applyMask(document.getElementById('editEmailDateInput'));

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
        if(s === 'reports') {
            generateReports();
            document.getElementById('reportPreviewArea').style.display = 'none';
        }
    };

    // --- RENDERIZAÇÃO ---
    window.renderData = function() {
        const grid = document.getElementById('cardsGrid');
        const historyList = document.getElementById('historyListContent');
        
        if(grid) grid.innerHTML = ''; 
        if(historyList) historyList.innerHTML = '';
        
        // Ordena por data antes de renderizar
        obligations.sort((a,b) => parseDate(a.date) - parseDate(b.date));
        
        obligations.forEach((item, i) => {
            if(item.completed) {
                if(historyList) {
                    const rowHtml = `
                        <div class="history-item">
                            <div class="h-col-company">${item.company}</div>
                            <div class="h-col-task">${item.name}</div>
                            <div class="h-col-date">${item.date}</div>
                            <div class="h-col-email">${item.emailDate || '---'}</div>
                            <div class="h-actions">
                                <button class="btn-restore" onclick="toggleTask(${i})" title="Reativar Pendência">
                                    <span class="material-icons-round">settings_backup_restore</span>
                                </button>
                            </div>
                        </div>`;
                    historyList.insertAdjacentHTML('beforeend', rowHtml);
                }
            } else {
                if(grid) grid.insertAdjacentHTML('beforeend', createCard(item, i));
            }
        });

        // SALVA SEMPRE QUE RENDERIZA
        localStorage.setItem('minhasObrigacoes', JSON.stringify(obligations));
        generateReports();
    }

    function createCard(item, i) {
        const today = new Date(); today.setHours(0,0,0,0);
        const due = parseDate(item.date);
        const diff = Math.ceil((due - today) / (1000*60*60*24));
        
        let colorClass = 'border-success', bClass = 'success-badge', bText = 'No Prazo';
        
        if(diff < 0) {
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
                    <input type="checkbox" onclick="toggleTask(${i})">
                </div>
                <div style="font-size:13px; color:#444">
                    Vencimento: <b>${item.date}</b><br>
                    E-mail: ${item.emailDate || '---'}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
                    <span class="status-badge ${bClass}">${bText}</span>
                    <div style="display:flex; gap:10px">
                        <button onclick="openEditModal(${i})" style="border:none; background:none; cursor:pointer; color:var(--win-accent)">
                            <span class="material-icons-round" style="font-size:18px">edit</span>
                        </button>
                        <button onclick="deleteTask(${i})" class="btn-delete">
                            <span class="material-icons-round" style="font-size:18px">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // --- RELATÓRIOS E IMPRESSÃO ---
    window.previewReport = () => {
        const selectedMonth = document.getElementById('reportMonthSelect').value;
        const previewContent = document.getElementById('reportPreviewContent');
        const previewArea = document.getElementById('reportPreviewArea');
        const filtered = obligations.filter(o => o.date.split('/')[1] === selectedMonth);
        
        if(filtered.length === 0) {
            alert("Nenhuma obrigação encontrada para este mês.");
            previewArea.style.display = 'none';
            return;
        }

        previewContent.innerHTML = '';
        filtered.forEach(item => {
            const statusLabel = item.completed ? 
                '<span class="status-text status-done">Concluído</span>' : 
                '<span class="status-text status-pending">Pendente</span>';

            const row = `
                <div class="history-item">
                    <div class="h-col-company">${item.company}</div>
                    <div class="h-col-task">${item.name}</div>
                    <div class="h-col-date">${item.date}</div>
                    <div class="h-col-email">${item.emailDate || '---'}</div>
                    <div class="h-status">${statusLabel}</div>
                </div>`;
            previewContent.insertAdjacentHTML('beforeend', row);
        });
        previewArea.style.display = 'block';
    };

    window.printReport = () => {
        const previewArea = document.getElementById('reportPreviewArea');
        if(previewArea.style.display === 'none') {
            alert("Primeiro clique em 'Visualizar' para gerar o relatório.");
            return;
        }
        window.print();
    };

    function generateReports() {
        const pending = obligations.filter(o => !o.completed).length;
        const urgent = obligations.filter(o => {
            const d = parseDate(o.date);
            const today = new Date(); today.setHours(0,0,0,0);
            const diff = Math.ceil((d - today) / (1000*60*60*24));
            return !o.completed && diff <= 5;
        }).length;
        const done = obligations.filter(o => o.completed).length;
        
        if(document.getElementById('countPending')) document.getElementById('countPending').innerText = pending;
        if(document.getElementById('countUrgent')) document.getElementById('countUrgent').innerText = urgent;
        if(document.getElementById('countDone')) document.getElementById('countDone').innerText = done;
    }

    // --- FILTRO DO HISTÓRICO ---
    window.filterHistory = () => {
        const search = document.getElementById('searchInput').value.toUpperCase();
        const month = document.getElementById('monthSelect').value;
        const items = document.querySelectorAll('#historyListContent .history-item');

        items.forEach(item => {
            const company = item.querySelector('.h-col-company').innerText.toUpperCase();
            const task = item.querySelector('.h-col-task').innerText.toUpperCase();
            const date = item.querySelector('.h-col-date').innerText;
            const itemMonth = date.split('/')[1];
            const matchesSearch = company.includes(search) || task.includes(search);
            const matchesMonth = (month === 'all' || itemMonth === month);
            item.style.display = (matchesSearch && matchesMonth) ? 'grid' : 'none';
        });
    };

    // --- CRUD E MODAIS ---
    window.toggleTask = i => { 
        obligations[i].completed = !obligations[i].completed; 
        renderData(); 
    };

    window.deleteTask = i => { 
        if(confirm("Excluir esta obrigação permanentemente?")) { 
            obligations.splice(i,1); 
            renderData(); 
        } 
    };

    // FUNÇÕES DE EDIÇÃO DISPONIBILIZADAS GLOBALMENTE
    window.openEditModal = (index) => {
        const item = obligations[index];
        document.getElementById('editIndex').value = index;
        document.getElementById('editCompanyInput').value = item.company;
        document.getElementById('editTaskInput').value = item.name;
        document.getElementById('editDateInput').value = item.date;
        document.getElementById('editEmailDateInput').value = item.emailDate || '';
        document.getElementById('editModal').style.display = 'flex';
    };

    window.closeEditModal = () => {
        document.getElementById('editModal').style.display = 'none';
    };

    window.saveEdit = () => {
        const i = document.getElementById('editIndex').value;
        const comp = document.getElementById('editCompanyInput').value;
        const task = document.getElementById('editTaskInput').value;
        const date = document.getElementById('editDateInput').value;

        if(comp && task && date.length === 10) {
            // Atualiza os dados no array global
            obligations[i].company = comp.toUpperCase();
            obligations[i].name = task.toUpperCase();
            obligations[i].date = date;
            obligations[i].emailDate = document.getElementById('editEmailDateInput').value;
            
            // Fecha o modal e renderiza (o renderData já salva no LocalStorage)
            closeEditModal();
            renderData();
        } else {
            alert("Preencha os campos obrigatórios!");
        }
    };

    const addBtn = document.getElementById('addBtn');
    if(addBtn) {
        addBtn.onclick = () => {
            const c = document.getElementById('companyInput'), n = document.getElementById('taskInput'), d = document.getElementById('dateInput'), e = document.getElementById('emailDateInput');
            if(c.value && n.value && d.value.length === 10) {
                obligations.push({ 
                    company: c.value.toUpperCase(), 
                    name: n.value.toUpperCase(), 
                    date: d.value, 
                    emailDate: e.value, 
                    completed: false 
                });
                c.value = ''; n.value = ''; d.value = ''; e.value = '';
                showSection('view');
            } else alert("Preencha Empresa, Obrigação e Data!");
        };
    }

    const toggleBtn = document.querySelector('.toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if(toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    renderData();
});