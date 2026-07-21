# Aurvm

App mobile de gestão financeira pessoal em React, TypeScript e Capacitor. Cada edição é salva imediatamente no armazenamento local, mantém um histórico recente e, no Android, também possui uma cópia no diretório privado do aplicativo. Quando o Google Drive está conectado, o arquivo `financas.json` é sincronizado automaticamente com o escopo limitado `drive.file`.

Os ícones de interface usam exclusivamente `@tabler/icons-react`, no estilo outline e stroke padrão 2.

Logos de assinaturas são pesquisadas exclusivamente no catálogo multicolorido `logos` (SVG Logos) da API Iconify. O SVG escolhido é armazenado pelo Capacitor Filesystem em `logos/{id}.svg`; o JSON guarda somente a referência necessária para restaurar o cache em outro aparelho. Excluir a assinatura também exclui o SVG local. Não há fallback monocromático.

## Desenvolvimento

```bash
npm install
copy .env.example .env
npm run dev
```

O modo web pode funcionar sem login obrigatório durante o desenvolvimento. Os dados continuam protegidos localmente e sobrevivem a recargas. Para simular a produção com login obrigatório, configure `VITE_REQUIRE_GOOGLE_LOGIN=true`.

## Google OAuth

1. No Google Cloud Console, crie um projeto e habilite a Google Drive API v3.
2. Configure a tela de consentimento OAuth com o nome, logotipo, e-mails de suporte e desenvolvedor, política de privacidade e termos de uso.
3. Declare os escopos `openid`, `email`, `profile` e `https://www.googleapis.com/auth/drive.file`.
4. Crie um cliente OAuth do tipo Web. Cadastre `http://localhost:4173` e `http://localhost:5173` para desenvolvimento e a origem HTTPS real de produção.
5. Crie um cliente OAuth do tipo Android para o pacote `com.aurvm.app`, cadastrando os SHA-1 dos certificados de debug, release e Google Play App Signing.
6. Copie `.env.example` para `.env`, preencha os dois Client IDs e use `VITE_REQUIRE_GOOGLE_LOGIN=true` na build de produção.
7. Execute `npm run cap:sync` depois de alterar credenciais ou código web.

O `.env` não deve ser versionado. Client IDs OAuth identificam o aplicativo e podem existir no cliente; nunca coloque Client Secret, refresh token ou chave privada no app.

## Proteção dos dados

- Gravação local imediata em toda mutação.
- Histórico local das 20 versões mais recentes.
- Arquivo atual e cópia anterior no armazenamento privado do app.
- Fila serializada para impedir que uma gravação antiga termine depois de uma nova.
- Reconciliação por data entre a cópia local e o Drive ao conectar ou restaurar a sessão.
- Validação estrutural antes de aceitar backups locais, importados ou remotos.
- Exportação e importação manual em JSON nas Configurações.
- O backup inclui dados financeiros e também tema, tela inicial, ordem e visibilidade do menu, recursos ativados, valores ocultos e modos de visualização preferidos.

O Drive oferece redundância, mas não substitui uma política de recuperação testada. Antes de publicar, valide login, restauração, modo offline e troca de aparelho usando contas de teste e as chaves de assinatura finais.

## Android / APK

Requer Android Studio, Android SDK e JDK 17 com `JAVA_HOME` configurado.

```bash
npm run cap:sync
cd android
gradlew.bat assembleDebug
```

O APK de debug será gerado em `android/app/build/outputs/apk/debug/app-debug.apk`.
