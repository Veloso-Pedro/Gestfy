import { supabase } from './supabase-config.js';

console.log("🚀 Motor do Checkout Carregado!");

// ==========================================
// 1. ATUALIZAR A INTERFACE (Mudar os Preços)
// ==========================================
function adaptarPlano() {
    const urlParams = new URLSearchParams(window.location.search);
    const planoEscolhido = urlParams.get('plano');

    // Valores padrão (completo)
    let valorPlano = 400.00;
    let nomePlano = "Plano Completo - Gestfy";
    let vantagens = [
        "Tudo do plano mensal",
        "Relatórios avançados",
        "Suporte prioritário via WhatsApp",
        "1 Consultoria Gratuita por mês"
    ];

    // Se detectar 'basico', altera as variáveis
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

    // Aplica as mudanças no HTML
    const precoFormatado = valorPlano.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('resumo-nome-plano').innerText = nomePlano;
    document.getElementById('resumo-preco-plano').innerText = precoFormatado;
    document.getElementById('resumo-preco-total').innerText = precoFormatado;

    // Aplica as mudanças na lista de vantagens
    const ulVantagens = document.querySelector('.lista-vantagens');
    if (ulVantagens) {
        ulVantagens.innerHTML = ''; // Limpa as vantagens antigas do HTML

        // Adiciona as novas vantagens com base no plano escolhido
        vantagens.forEach(textoVantagem => {
            const li = document.createElement('li');
            li.innerHTML = `✔️ ${textoVantagem}`;
            ulVantagens.appendChild(li);
        });
    }

    return valorPlano; // Devolve o valor exato para cobrarmos no banco de dados
}

// Dispara a mudança de interface na hora e guarda o valor a cobrar!
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
            alert("⚠️ Por favor, insere um e-mail válido.");
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
            // A. Cria utilizador na Autenticação
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: senha,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro desconhecido ao criar utilizador.");

            const userUuid = authData.user.id;

            // B. Salva os dados da Empresa
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

            // C. Regista o pagamento com o VALOR CORRETO DO PLANO
            const { error: payError } = await supabase
                .from('pagamentos')
                .insert([{
                    empresa_id: userUuid,
                    valor_pago: valorFinalCobrado // Usa a variável que foi atualizada pela interface!
                }]);

            if (payError) throw payError;

            alert(`Pagamento de R$ ${valorFinalCobrado} registado com sucesso! 🎉`);
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
}