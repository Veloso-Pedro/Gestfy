import { supabase } from './supabase-config.js';

console.log("🚀 Motor do Checkout Carregado!");

// ==========================================
// 1. ATUALIZAR A INTERFACE (Mudar os Preços)
// ==========================================
function adaptarPlano() {
    const urlParams = new URLSearchParams(window.location.search);
    const planoEscolhido = urlParams.get('plano');

    let valorPlano = 400.00;
    let nomePlano = "Plano Completo - Gestfy";
    let vantagens = [
        "Tudo do plano mensal",
        "Relatórios avançados",
        "Suporte prioritário via WhatsApp",
        "1 Consultoria Gratuita por mês"
    ];

    if (planoEscolhido === 'basico') {
        valorPlano = 60.00;
        nomePlano = "Plano basico - Gestfy";
        vantagens = [
            "Acesso total ao sistema",
            "Gestão de Notas Fiscais",
            "Suporte por email"
        ];
        console.log("Mudando para o Plano basico...");
    }

    const precoFormatado = valorPlano.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('resumo-nome-plano').innerText = nomePlano;
    document.getElementById('resumo-preco-plano').innerText = precoFormatado;
    document.getElementById('resumo-preco-total').innerText = precoFormatado;

    const ulVantagens = document.querySelector('.lista-vantagens');
    if (ulVantagens) {
        ulVantagens.innerHTML = '';

        vantagens.forEach(textoVantagem => {
            const li = document.createElement('li');
            li.innerHTML = `✔️ ${textoVantagem}`;
            ulVantagens.appendChild(li);
        });
    }

    return valorPlano;
}

const valorFinalCobrado = adaptarPlano();


// ==========================================
// 2. VALIDAÇÃO E ENVIO (Banco de Dados)
// ==========================================
const formRegistro = document.getElementById('form-registro');
const btnRegistrar = document.getElementById('btn-registrar');

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

if (formRegistro) {
    formRegistro.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const nome = document.getElementById('nome').value.trim();
        const cnpj = document.getElementById('cnpj').value.trim();
        const regime = document.getElementById('regime-tributario').value;

        if (!validarEmail(email)) {
            alert("⚠️ Por favor, insira um e-mail válido.");
            document.getElementById('email').focus();
            return;
        }

        if (senha.length < 6) {
            alert("⚠️ A palavra-chave deve ter pelo menos 6 caracteres.");
            return;
        }

        btnRegistrar.innerText = "processando...";
        btnRegistrar.disabled = true;

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: senha,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro desconhecido ao criar utilizador.");

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
                    valor_pago: valorFinalCobrado
                }]);

            if (payError) throw payError;

            alert(`Pagamento de R$ ${valorFinalCobrado} registado com sucesso! 🎉`);
            window.location.href = "dashboard.html";

        } catch (erro) {
            console.error("❌ Falha no Checkout:", erro.message);

            if (erro.message.includes("empresas_cnpj_cpf_key")) {
                alert("⚠️ Este CNPJ/CPF já está registado em outra conta.");
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
}