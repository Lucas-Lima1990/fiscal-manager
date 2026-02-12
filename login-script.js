document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // DEFINA SEU USUÁRIO E SENHA AQUI
    if (user === "LUCAS" && pass === "1704") {
        // Salva que o usuário está logado
        sessionStorage.setItem('logado', 'true');
        window.location.href = "index.html"; // Vai para a tela de obrigações
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
});