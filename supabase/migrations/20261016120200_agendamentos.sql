create extension if not exists pg_cron;

select cron.schedule(
  'catfinance-processar-recorrencias',
  '15 3 * * *',
  $$ select privado.processar_recorrencias(null, current_date) $$
);

select cron.schedule(
  'catfinance-limpar-dados-api',
  '*/30 * * * *',
  $$ select privado.limpar_dados_api() $$
);
