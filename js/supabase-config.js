
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ysvgpvuftonqaesruvmj.supabase.co';

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmdwdnVmdG9ucWFlc3J1dm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDc0MDQsImV4cCI6MjA5MjUyMzQwNH0.mi-lbmMd0HXVuebx-lqA8BdicbfoWu8KkJdSYlmoRbI';

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Conexão com o Supabase inicializada com sucesso!");

window.alert = function(mensagem) {
    let icone = '🔔';
    let corBorda = 'var(--gestfy-roxo)'; 

    if (mensagem.includes('🎉') || mensagem.toLowerCase().includes('sucesso')) {
        icone = '✅';
        corBorda = '#10b981';
        mensagem = mensagem.replace('🎉', '').trim(); 
    } else if (mensagem.includes('⚠️') || mensagem.toLowerCase().includes('erro') || mensagem.toLowerCase().includes('incorreto') || mensagem.toLowerCase().includes('falha')) {
        icone = '🚨';
        corBorda = '#ef4444';
        mensagem = mensagem.replace('⚠️', '').trim();
    }

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'gestfy-toast';
    toast.style.borderLeftColor = corBorda;
    
    toast.innerHTML = `
        <div class="toast-icone">${icone}</div>
        <div class="toast-mensagem">${mensagem}</div>
    `;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('escondendo');
        setTimeout(() => toast.remove(), 400); 
    }, 4500);
};