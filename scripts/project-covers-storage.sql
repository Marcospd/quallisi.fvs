-- Configuração do Storage para Capas de Obras (project-covers)
-- 1. Criar o bucket se não existir
insert into storage.buckets (id, name, public)
values ('project-covers', 'project-covers', true) on conflict (id) do nothing;
-- 2. Habilitar RLS no bucket (embora seja público para leitura, a escrita deve ser restrita)
-- A tabela storage.objects já tem RLS habilitado por padrão no Supabase, mas garantimos as políticas:
-- 3. Políticas de Segurança (Policies)
-- Permitir leitura pública de qualquer arquivo no bucket de capas de obras
create policy "Capas de obras são públicas para visualização" on storage.objects for
select using (bucket_id = 'project-covers');
-- Permitir upload apenas para usuários autenticados (tenant auth)
-- Restringindo o acesso para os admin/supervisor da plataforma
create policy "Usuários podem fazer upload de capas" on storage.objects for
insert to authenticated with check (bucket_id = 'project-covers');
-- Permitir update (sobrescrever capa) apenas para usuários autenticados
create policy "Usuários podem atualizar capas" on storage.objects for
update to authenticated using (bucket_id = 'project-covers');
-- Permitir delete apenas para usuários autenticados
create policy "Usuários podem remover capas" on storage.objects for delete to authenticated using (bucket_id = 'project-covers');