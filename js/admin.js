import { supabase } from './supabase-config.js';

const corpoTabela = document.getElementById('corpo-tabela-leads');
const modalResposta = document.getElementById('modal-resposta');
const fecharModalBtn = document.getElementById('fechar-modal-resposta');
const formResposta = document.getElementById('form-resposta-email');
const emailDestinatarioInput = document.getElementById('email-destinatario');
const mensagemRespostaInput = document.getElementById('mensagem-resposta');

let leadSelecionadoEmail = "";
let leadSelecionadoNome = "";

//PASSO 1: CARREGAR LEADS DO SUPABASE
async function carregarLeads() {
    try {
        const { data: leads, error } = await supabase
            .from('leads_contato')
            .select('*');

        if (error) throw error;

        corpoTabela.innerHTML = '';

        if (leads.length === 0) {
            corpoTabela.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        Nenhum lead de contato encontrado na base de dados.
                    </td>
                </tr>`;
            return;
        }

        leads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${lead.nome}</strong></td>
                <td>${lead.email}</td>
                <td>${lead.telefone || 'Não informado'}</td>
                <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-transform: none; text-overflow: ellipsis;">
                    ${lead.mensagem}
                </td>
                <td>
                    <button class="botao-tabela-responder" data-email="${lead.email}" data-nome="${lead.nome}">
                        📩 Responder
                    </button>
                </td>
            `;
            corpoTabela.appendChild(tr);
        });

        document.querySelectorAll('.botao-tabela-responder').forEach(botao => {
            botao.addEventListener('click', (e) => {
                leadSelecionadoEmail = e.target.getAttribute('data-email');
                leadSelecionadoNome = e.target.getAttribute('data-nome');
                abrirModal(leadSelecionadoEmail);
            });
        });

    } catch (error) {
        console.error('Erro ao carregar leads:', error.message);
        window.alert('⚠️ Erro ao carregar a lista de leads.');
    }
}

//PASSO 2: CONTROLE DO MODAL
function abrirModal(email) {
    emailDestinatarioInput.value = email;
    mensagemRespostaInput.value = '';
    modalResposta.classList.add('modal-ativo');
}

function fecharModal() {
    modalResposta.classList.remove('modal-ativo');
}

fecharModalBtn.addEventListener('click', fecharModal);

emailjs.init("99w46HeB4TeYW06M0");

formResposta.addEventListener('submit', (e) => {
    e.preventDefault();

    
    const btnSubmit = formResposta.querySelector('button');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = "A enviar e-mail...";
    btnSubmit.disabled = true;


    const parametrosTemplate = {
        to_email: leadSelecionadoEmail,
        to_name: leadSelecionadoNome,
        message: mensagemRespostaInput.value,
        reply_to: "suporte@gestfy.com"
    };


    emailjs.send("service_cszbb59", "template_h04632c", parametrosTemplate)
        .then(function (response) {
            console.log('SUCESSO!', response.status, response.text);
            window.alert('🎉 E-mail enviado com sucesso pela conta padrão!');
            fecharModal();
        }, function (error) {
            console.log('FALHA...', error);
            window.alert('🚨 Erro ao enviar o e-mail. Verifica o console.');
        })
        .finally(() => {
            btnSubmit.textContent = textoOriginal;
            btnSubmit.disabled = false;
        });
});

carregarLeads();