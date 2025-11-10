# Live Chat - Powered by Supabase 💬

Um aplicativo de chat em tempo real construído com Next.js 14, Supabase e Tailwind CSS.

## 🚀 Features

- ✅ Chat em tempo real usando Supabase Realtime
- ✅ Interface moderna e responsiva
- ✅ Timestamps relativos (ex: "há 2 minutos")
- ✅ Auto-scroll para novas mensagens
- ✅ Escolha de nome de usuário
- ✅ Mensagens persistentes no banco de dados
- ✅ TypeScript para type safety

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **Supabase** - Backend as a Service (Database + Realtime)
- **Tailwind CSS** - Estilização
- **TypeScript** - Type safety
- **date-fns** - Formatação de datas

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <your-repo-url>
cd supabase-live-chat
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```

Edite `.env.local` e adicione suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

4. Execute o projeto:
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🗄️ Schema do Banco de Dados

O aplicativo usa as seguintes tabelas no Supabase:

### chat_rooms
- `id` (UUID, primary key)
- `name` (TEXT)
- `created_at` (TIMESTAMPTZ)

### chat_users
- `id` (UUID, primary key)
- `username` (TEXT, unique)
- `avatar_url` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)

### chat_messages
- `id` (UUID, primary key)
- `room_id` (UUID, foreign key)
- `user_id` (UUID, foreign key, nullable)
- `username` (TEXT)
- `content` (TEXT)
- `created_at` (TIMESTAMPTZ)

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Conecte seu repositório no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy! 🎉

### Outras opções
- Netlify
- Railway
- Render

## 📝 Como Usar

1. Acesse o aplicativo
2. Digite seu nome de usuário
3. Comece a conversar!
4. Suas mensagens aparecerão em tempo real para todos os usuários conectados

## 🎨 Customização

- **Cores**: Edite `tailwind.config.js` para mudar o tema
- **Layout**: Modifique `components/ChatRoom.tsx`
- **Estilos**: Ajuste `app/globals.css`

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

Feito com ❤️ usando Supabase e Next.js
