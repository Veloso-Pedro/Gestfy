import { supabase } from './supabase-config.js';

const formRegistro = document.getElementById('form-registro');
const btnRegistrar = document.getElementById('btn-registrar');

// ==========================================
// NOVA PARTE: DETEÇÃO DO PLANO PELA URL
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const planoEscolhido = urlParams.get('plano') || 'anual'; // Assume anual por padrão

let valorPlano = 468.00;
let nomePlano = "Plano Anual - Gestfy";

if (planoEscolhido === 'mensal') {
    valorPlano = 49.00;
    nomePlano = "Plano Mensal - Gestfy";
}

// Atualiza os textos no HTML (se já tiveres colocado os IDs no checkout.html)
const elNomePlano = document.getElementById('resumo-nome-plano');
const elPrecoPlano = document.getElementById('resumo-preco-plano');
const elPrecoTotal = document.getElementById('resumo-preco-total');
const precoFormatado = valorPlano.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

if (elNomePlano) elNomePlano.innerText = nomePlano;
if (elPrecoPlano) elPrecoPlano.innerText = precoFormatado;
if (elPrecoTotal) elPrecoTotal.innerText = precoFormatado;
// ==========================================


// O TEU CÓDIGO ORIGINAL CONTINUA INTACTO DAQUI PARA BAIXO:
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

formRegistro.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const nome = document.getElementById('nome').value.trim();
    const cnpj = document.getElementById('cnpj').value.trim();
    const regime = document.getElementById('regime-tributario').value;

    if (!validarEmail(email)) {
        alert("⚠️ Por favor, insere um e-mail válido (ex: nome@dominio.com).");
        document.getElementById('email').focus();
        return;
    }

    if (senha.length < 6) {
        alert("⚠️ A palavra-passe deve ter pelo menos 6 caracteres.");
        return;
    }

    btnRegistrar.innerText = "A processar...";
    btnRegistrar.disabled = true;

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: senha,
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error("Não foi possível criar o utilizador. Verifica se este e-mail já está registado.");
        }

        const userUuid = authData.user.id;

        const { error: dbError } = await supabase
            .from('empresas')
            .insert([{
                id: userUuid,
                nome_responsavel: nome,
                cnpj_cpf: cnpj,
                email: email,
                regime_tributario: regime
            }]);

        if (dbError) throw dbError;

        const { error: payError } = await supabase
            .from('pagamentos')
            .insert([{
                empresa_id: userUuid,
                valor_pago: valorPlano // AGORA USA O VALOR DINÂMICO
            }]);

        if (payError) throw payError;

        // Atualizei o alerta para mostrar o sucesso com o valor correto
        alert(`Conta criada e pagamento de ${precoFormatado} registado com sucesso! 🎉`);
        window.location.href = "dashboard.html";

    } catch (erro) {
        console.error("❌ Falha no Checkout:", erro.message);

        if (erro.message.includes("empresas_cnpj_cpf_key")) {
            alert("⚠️ Este CNPJ/CPF já está registado noutra conta.");
        } else if (erro.message.includes("already registered")) {
            alert("⚠️ Este e-mail já está em uso.");
        } else {
            alert("Erro: " + erro.message);
        }
    } finally {
        btnRegistrar.innerText = "Confirmar Assinatura";
        btnRegistrar.disabled = false;
    }
});