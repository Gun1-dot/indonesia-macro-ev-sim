# Indonesia Oil-Macro-EV Simulator

An interactive decision-support dashboard that simulates how global oil price changes affect Indonesia's macroeconomy, and how EV 2-wheeler adoption can build structural resilience.

**Created by Gunawan Panjaitan** — an EV enthusiast exploring the intersection of energy economics and Indonesia's future.

## Features

- **Interactive simulation** — adjust oil price, exchange rate, pass-through policy, and EV adoption to see real-time macro impacts
- **5 preset scenarios** — Base Case, Oil Shock, Double Hit, Reform Path, EV Future
- **Policy brief engine** — auto-generates 1st/2nd order impact analysis, social/political consequences, urgency framing
- **Fiscal dividend calculator** — shows how subsidy savings translate to hospitals, schools, and roads
- **Environmental impact** — CO2 reduction and tree-planting equivalents
- **AI chatbot** — powered by Claude, answers questions about methodology and results
- **Apple-inspired design** — scroll-driven storytelling, clean white layout

## Tech Stack

- **React 18** + **Vite** (fast builds, tiny bundle)
- **Zero dependencies** beyond React (no charting libraries, no UI frameworks)
- **100% client-side** — no backend required, no database, no server costs
- **Anthropic API** for the AI chatbot (optional — dashboard works without it)

---

## 🚀 Deploy for Free (3 Options)

### Option A: Cloudflare Pages (RECOMMENDED — Free, Unlimited Bandwidth)

**Why:** Unlimited bandwidth on free tier, 300+ global CDN nodes, fastest option.

1. Push this project to a GitHub repository
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create a project
3. Connect your GitHub repo
4. Set build settings:
   - **Framework preset:** React (Vite)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Deploy**
6. Your site is live at `your-project.pages.dev`

**Custom domain:** Add in Cloudflare Pages settings → Custom Domains (free SSL included).

### Option B: Vercel (Free, Best for React)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repo → Vercel auto-detects Vite/React
4. Click **Deploy**
5. Live at `your-project.vercel.app`

**Free tier:** 100GB bandwidth/month (plenty for this dashboard).

### Option C: Netlify (Free, Easy)

1. Push to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git
3. Set build command: `npm run build`, publish directory: `dist`
4. Click **Deploy**
5. Live at `your-project.netlify.app`

---

## 🤖 AI Chatbot Setup

The chatbot uses the Anthropic API. In the Claude.ai artifact environment, it works automatically. For standalone deployment:

The API call is made client-side. The Anthropic API key is handled by the artifact environment when running inside Claude.ai. For standalone deployment, you have two options:

### Option 1: Serverless Proxy (Recommended for production)
Create a small serverless function (Cloudflare Worker, Vercel Edge Function, or Netlify Function) that proxies requests to the Anthropic API with your key stored as an environment variable.

Example Cloudflare Worker:
```js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    const body = await request.json();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
```

Then update the fetch URL in `App.jsx` to point to your worker URL instead of the Anthropic API directly.

### Option 2: Disable chatbot
Simply remove the `<ChatBot />` component from the footer section. The dashboard works perfectly without it.

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Hosting (Cloudflare Pages) | **Free** (unlimited bandwidth) |
| Custom domain (.com) | ~$10/year |
| SSL certificate | **Free** (included) |
| Anthropic API (chatbot) | ~$0.003 per chat message (optional) |
| **Total** | **$0 – $10/year** |

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Build for Production

```bash
npm run build
# Output in /dist — deploy this folder
```

---

## Sources

Bank Indonesia · Ministry of Finance (APBN) · BPS · ESDM · IEA · World Bank · IISD (2026) · Pertamina · ICCT (2025) · AISI · IPCC Emission Factors

## Contact

- Email: gunawan_pnjaitan@yahoo.co.id
- LinkedIn: [Gunawan Panjaitan](https://www.linkedin.com/in/gunawan-panjaitan/)

---

*This simulation uses various research sources combined with simplifying assumptions. It is not intended as a definitive conclusion — rather, it is an invitation to think about what makes sense and what doesn't. The model is imperfect, as all models are. Contributions and improvements are welcome.*
