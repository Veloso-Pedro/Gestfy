
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ysvgpvuftonqaesruvmj.supabase.co';

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmdwdnVmdG9ucWFlc3J1dm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDc0MDQsImV4cCI6MjA5MjUyMzQwNH0.mi-lbmMd0HXVuebx-lqA8BdicbfoWu8KkJdSYlmoRbI';

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Conexão com o Supabase inicializada com sucesso!");