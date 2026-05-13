import { supabase } from './supabase-config.js';

const formContato = document.getElementById('form-contato');

formContato.addEventListener('submit', async function(evento) {
    
    evento.preventDefault();

    const nomeDigitado = document.getElementById('nome').value;
    const emailDigitado = document.getElementById('email').value;
    const telefoneDigitado = document.getElementById('telefone').value;
    const mensagemDigitada = document.getElementById('mensagem').value;

    const botaoEnviar = formContato.querySelector('.botao-enviar');
    const textoOriginalBotao = botaoEnviar.innerText;
    botaoEnviar.innerText = "A enviar...";
    botaoEnviar.disabled = true;

    try {
        const { data, error } = await supabase
            .from('leads_contato')
            .insert([
                { 
                    nome: nomeDigitado, 
                    email: emailDigitado, 
                    telefone: telefoneDigitado, 
                    mensagem: mensagemDigitada 
                }
            ]);

        if (error) {
            throw error;
        }

        alert("Mensagem enviada com sucesso! A nossa equipa entrará em contacto brevemente.");
        
        formContato.reset();

    } catch (erro) {
        console.error("Erro ao enviar mensagem: ", erro);
        alert("Oops! Ocorreu um erro ao enviar a tua mensagem. Tenta novamente mais tarde.");
    } finally {
        botaoEnviar.innerText = textoOriginalBotao;
        botaoEnviar.disabled = false;
    }
});