# Deploy no Render

Este projeto está preparado para **Expo → Laravel no Render → PostgreSQL**. O deploy não foi executado.

## Decisões e limitações

- Localmente, o backend continua usando `database/database.sqlite`.
- Em produção, use PostgreSQL: o disco do Web Service gratuito é efêmero.
- O PostgreSQL gratuito do Render expira após 30 dias e não tem backups. É adequado para teste; para dados duráveis, use um plano pago ou PostgreSQL externo durável.
- Fotos usam disco configurável. O `render.yaml` seleciona `s3`; Cloudflare R2 ou outro serviço S3 compatível impede a perda de uploads em reinicializações.
- O container executa apenas `migrate --force`; nunca roda seeders nem `migrate:fresh`.

## 1. Backup local sem alterar dados

Com o `.env` apontando para SQLite:

```bash
php artisan personagens:export personagens-backup.json
```

Guarde o JSON fora do Git. Se houver fotos em `storage/app/public/personagens`, copie essa pasta também. Envie depois os arquivos para `personagens/` no bucket; os caminhos do banco permanecem válidos.

## 2. GitHub e serviços

1. Revise, faça commit e push. Não versione `.env`, o JSON ou credenciais.
   Antes do push, rode `git ls-files .env mobile/.env`; se algum aparecer, remova-o apenas do índice com `git rm --cached .env mobile/.env` (sem apagar o arquivo local) e troque qualquer segredo que já tenha sido publicado.
2. No Render, conecte o GitHub e escolha **New → Blueprint**.
3. Selecione este repositório e confirme `render.yaml`.
4. Informe os campos secretos (`sync: false`) antes de aplicar.

Variáveis principais:

| Variável | Valor |
|---|---|
| `APP_KEY` | saída local de `php artisan key:generate --show` |
| `APP_URL` | `https://SEU-SERVICO.onrender.com` (sem `/api`) |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `DB_CONNECTION` | `pgsql` |
| `DB_URL` | conexão interna preenchida pelo Blueprint |

Fotos persistentes via R2/S3:

| Variável | Valor |
|---|---|
| `PERSONAGENS_FILESYSTEM_DISK` | `s3` |
| `AWS_ACCESS_KEY_ID` | ID da credencial |
| `AWS_SECRET_ACCESS_KEY` | segredo da credencial |
| `AWS_DEFAULT_REGION` | `auto` no R2, ou a região S3 |
| `AWS_BUCKET` | nome do bucket |
| `AWS_ENDPOINT` | endpoint S3 da conta |
| `AWS_URL` | URL pública/base do bucket |
| `AWS_USE_PATH_STYLE_ENDPOINT` | normalmente `false` |

O bucket precisa permitir leitura pública ou ter URL/CDN pública. Sem fotos, você pode começar com `PERSONAGENS_FILESYSTEM_DISK=public`, sabendo que uploads serão temporários no plano gratuito.

## 3. Primeiro deploy

1. `autoDeployTrigger` está `off`; mantenha assim na migração inicial.
2. Aplique o Blueprint. O Docker instala Apache/PHP com PostgreSQL e GD, usa `PORT`, executa migrations e inicia a API.
3. Aguarde o health check `/up`.
4. Teste `https://SEU-SERVICO.onrender.com/api/personagens`.
5. Em falha, consulte os logs. A produção usa `stderr` e não mostra debug ao cliente.

## 4. Importar os dados preservando IDs

No Render Shell, caso disponível, envie temporariamente o backup e execute:

```bash
php artisan personagens:import personagens-backup.json
```

O comando insere somente IDs ausentes e ajusta a sequência do PostgreSQL. Não altera registros existentes, salvo com `--update`. Exclua o JSON do servidor após conferir.

Sem Shell, execute localmente usando temporariamente a **External Database URL** como `DB_URL` e `DB_CONNECTION=pgsql`. Não salve a URL no Git ou em comandos compartilhados; revogue o acesso externo ao terminar.

## 5. Configurar o Expo

Crie `mobile/.env` (não versionado):

```dotenv
EXPO_PUBLIC_API_URL=https://SEU-SERVICO.onrender.com/api
```

Reinicie o Metro:

```bash
cd mobile
npx expo start --clear
```

É compatível com Expo Go. Localmente, altere só `mobile/.env` para o IP da máquina, como `http://192.168.1.10:8000/api`; em celular, `localhost` aponta para o celular.

## 6. Checklist

- `/up` retorna sucesso.
- `/api/personagens` retorna JSON e os IDs esperados.
- Lista e detalhe abrem no Expo Go em outra rede.
- `imagem_url` usa o bucket público ou a API.
- Upload, troca e exclusão de foto funcionam.
- `APP_DEBUG=false`; nenhuma credencial aparece no Git ou logs.
- Só então habilite Auto-Deploy, se desejar.

## Alternativa sem Blueprint

Crie o PostgreSQL e depois **New → Web Service**. Conecte o GitHub, escolha runtime **Docker**, Dockerfile `./Dockerfile`, contexto `.`, health check `/up` e Auto-Deploy desligado inicialmente. Cadastre as variáveis acima e use a **Internal Database URL** como `DB_URL`.
