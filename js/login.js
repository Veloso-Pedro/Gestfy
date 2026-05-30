import { supabase } from './supabase-config.js';

console.log("🚀 Sistema de Login inicializado!");

const formLogin = document.getElementById('form-login');
const btnLogin = document.getElementById('btn-login');

if (formLogin) {
    formLogin.addEventListener('submit', async function(evento) {
        evento.preventDefault();

        const emailDigitado = document.getElementById('email').value.trim();
        const senhaDigitada = document.getElementById('senha').value;

        const textoOriginal = btnLogin.innerText;
        btnLogin.innerText = "Verificando Credenciais...";
        btnLogin.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailDigitado,
                password: senhaDigitada,
            });

            if (error) throw error;

            console.log("✅ Login aprovado! redirecionando...");
            
            window.location.href = "dashboard.html";

        } catch (erro) {
            console.error("❌ Falha no login:", erro.message);
            
            if (erro.message.includes("Invalid login credentials")) {
                alert("⚠️ E-mail ou palavra-chave incorretos. Tenta novamente.");
            } else {
                alert("⚠️ Erro ao entrar: " + erro.message);
            }
            
            document.getElementById('senha').value = "";
            document.getElementById('senha').focus();
            
        } finally {
            btnLogin.innerText = textoOriginal;
            btnLogin.disabled = false;
        }
    });
}