document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    const lockIcon = document.getElementById('lockIcon');
    const loginForm = document.getElementById('loginForm');
    const loginHeader = document.getElementById('loginHeader');
    const headerTitle = document.getElementById('headerTitle');
    const headerDesc = document.getElementById('headerDesc');
    const loginBox = document.querySelector('.login-box');
    const errorMsg = document.getElementById('errorMsg');

    if (user === "LUCAS" && pass === "1704") {
        // 1. Inicia o sumiço do formulário e descrição
        loginForm.classList.add('form-hidden');
        headerDesc.style.opacity = "0";

        // 2. Centraliza o container do cadeado no meio da box
        setTimeout(() => {
            loginHeader.classList.add('header-centered');
        }, 100);

        // 3. Muda para o cadeado aberto e altera o texto
        setTimeout(() => {
            headerTitle.innerText = "Acesso Permitido";
            headerTitle.style.color = "var(--win-success)";
            headerTitle.style.fontSize = "30px";
            headerTitle.style.fontWeight = "700";
            
            lockIcon.innerText = "lock_open";
            lockIcon.classList.add('lock-open-success');
        }, 400);

        // 4. Salva a sessão no navegador
        sessionStorage.setItem('logado', 'true');
        
        // 5. Redireciona para o sistema principal
        setTimeout(() => {
            window.location.href = "index.html";
        }, 4000);

    } else {
        // Erro: vibração da caixa e mensagem
        errorMsg.style.display = 'block';
        loginBox.classList.add('shake');
        
        setTimeout(() => {
            loginBox.classList.remove('shake');
        }, 400);
        
        document.getElementById('password').value = "";
    }
});