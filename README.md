# Aurvm

App mobile de gestão financeira pessoal em React, TypeScript e Capacitor. Os dados persistentes vivem exclusivamente no arquivo `financas.json`, criado pelo app no Google Drive do usuário com o escopo `drive.file`.

Os ícones de interface usam exclusivamente `@tabler/icons-react`, no estilo outline e stroke padrão 2.

Logos de assinaturas são pesquisadas exclusivamente no catálogo multicolorido `logos` (SVG Logos) da API Iconify. O SVG escolhido é armazenado pelo Capacitor Filesystem em `logos/{id}.svg`; o JSON guarda somente a referência necessária para restaurar o cache em outro aparelho. Excluir a assinatura também exclui o SVG local. Não há fallback monocromático.

## Desenvolvimento

```bash
npm install
copy .env.example .env
npm run dev
```

O modo web abre com dados de demonstração em memória. Ele não usa `localStorage` ou `sessionStorage`; sem conexão Google, alterações desaparecem ao recarregar.

## Google OAuth

1. No Google Cloud Console, habilite Google Drive API v3.
2. Crie clientes OAuth para Web e Android; o pacote Android é `com.aurvm.app`.
3. Copie `.env.example` para `.env` e preencha os dois IDs.
4. Para o cliente Android, cadastre os fingerprints SHA-1 do certificado de debug/release.
5. Execute `npm run cap:sync` depois de alterar credenciais ou código web.

## Android / APK

Requer Android Studio, Android SDK e JDK 17 com `JAVA_HOME` configurado.

```bash
npm run cap:sync
cd android
gradlew.bat assembleDebug
```

O APK de debug será gerado em `android/app/build/outputs/apk/debug/app-debug.apk`.
