<h3 align="center">
  <a name="readme-top"></a>
  <img src="https://ragextract.com/favicon.svg" height="64" alt="Ragextract" />
</h3>
<h4 align="center" style="font-family:monospace">TURNS DOCUMENTS INTO DATA THE SMARTER WAY</h4>
<div align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-ragextract">
    <img src="https://img.shields.io/npm/v/n8n-nodes-ragextract?style=for-the-badge&color=FF2B2B&logo=npm&logoColor=white" alt="npm version" />
  </a>
  <a href="https://ragextract.com/support">
    <img src="https://img.shields.io/badge/Support-FF2B2B?style=for-the-badge&logoColor=white" alt="Support" />
  </a>
  <a href="https://github.com/subworkflow-ai/n8n-nodes-ragextract/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/Licence-MIT-333333?style=for-the-badge" alt="MIT licence" />
  </a>
</div>

# n8n-nodes-ragextract

The official [n8n](https://n8n.io) community node for [Ragextract](https://ragextract.com) — semantic search and structured outputs for documents.

Built on the Ragextract **v2 API**. Works as a regular node and as an
[AI agent tool](#using-it-as-an-ai-agent-tool).

Please use this project's [issue tracker](https://github.com/subworkflow-ai/n8n-nodes-ragextract/issues)
for bugs and feature requests, or [get in touch](https://ragextract.com/support) for help with your
account.

## What is Ragextract?

Ragextract helps you get through hundreds of documents quickly and extract facts and figures in
minutes using AI. Under the hood, we deploy a vision-based document question & answer and RAG
pipeline.

### You can use Ragextract to…

* **Turn a folder of contracts into a table** — one row per agreement, one column per question
  (parties, term, renewal notice, liability caps), with every answer citing the page it came from.
* **Read supplier invoices that no two suppliers lay out the same way** — supplier, invoice number,
  dates, totals, tax and line items, ready to post into your accounting system.
* **Watch lease and contract dates** — current term ends, notice periods and auto-renewal — so a
  scheduled workflow raises the alert before the window closes.
* **Compare subcontractor bids side by side** — bid totals, scope exclusions, hourly rates and
  material lead times across every bid for one package.
* **Pull diagrams and figures out of technical documents**, not just text: image columns answer with
  a region of a page, so charts, floor plans and care pathways come back too.
* **Give an AI agent page-level retrieval** over thousands of pages, so it answers from the three
  pages that matter instead of stuffing a whole document into the context window.

Learn more at [ragextract.com](https://ragextract.com).

## Installation 

### Cloud and self-hosted

Install via **Settings → Community Nodes** in your n8n instance, searching for
`n8n-nodes-ragextract`.

### Self-hosted CLI

```bash
npm install n8n-nodes-ragextract
```

## Credentials

You need a Ragextract account and an API key.

1. Sign up at [ragextract.com](https://ragextract.com)
2. Go to **Settings → Keys → Create API Key**
3. Paste the key into the node's **Ragextract API** credential

### Two kinds of key, and what each one gets you

| Key | Reaches |
| --- | --- |
| `psk_…` **personal key** | Every workspace you can, at your own permission level. **Recommended.** |
| `sk_…` workspace key | The single workspace it belongs to. |

Both work with this node. A personal key can be narrowed to specific workspaces and tables, with
read or read-write on each; an unscoped one does everything you can do and follows your permissions
if they change. See [Permissions](https://ragextract.com/docs/permissions) and
[Authentication](https://ragextract.com/developers/api/authentication).

**Base URL** only needs changing for a private deployment. Leave it at `https://api.ragextract.com`
otherwise — the node appends `/v2` itself.

## Resources and operations

| Resource | Operations |
| --- | --- |
| **Workspace** | Get Many, Get, Create, Update |
| **File** | Upload, Get Many, Get, Get Items, Get Item, Search, Share, Delete |
| **Job** | Get Many, Get, Cancel |
| **Table** | Get Many, Get, Create, Update, Delete |
| **Table Column** | Get Many, Create, Update, Delete, Run |
| **Table Row** | Get Many, Create, Delete |
| **Table Cell** | Get Many, Set Override, Clear Override, Get Events, Get Facts |
| **Table Run** | Start, Preview, Get Many, Get, Cancel, Cancel All |
| **Bundle** | Get Many, Get, Create, Update, Delete, Add Files, Update File, Remove File |

Every operation except **Workspace → Get Many** and **Workspace → Create** takes a **Workspace**: v2
nests every resource under one. Pick it from the dropdown, or supply an ID by expression.

## How the node behaves

**Upload is the only ingest verb.** Every upload is parsed *and* embedded, so a file is searchable
as soon as it finishes. There is no separate vectorize step to remember.

**Upload waits by default** and returns the finished file, so the next node can use it directly. Turn
**Wait For Completion** off to get the job back immediately and poll it with **Job → Get** later —
the right choice for anything large enough that holding the execution open is unreasonable.

**Large files just work.** Anything over 100 MB switches to a multipart upload automatically, and
rate limits are retried with backoff rather than surfaced as a failure.

**Pages come back as binary.** **Search**, **Get Item** and **Get Items** have a **Download Files**
toggle that fetches each result's page through its signed share link and attaches it as binary data —
ready to hand to a vision model or write to storage.

**Table runs spend credits, per cell.** **Table Run → Preview** prices exactly the same selection
beforehand and charges nothing. Worth wiring in before a run over a large table. See
[Credits](https://ragextract.com/docs/credits).

**A rerun never overwrites a human correction**, and it skips rows whose documents are still
ingesting — so the cell count it reports is what actually started, and `skippedRowIds` names the rows
that fell out. See [Running and reruns](https://ragextract.com/docs/running-and-reruns).

**Given both rows and columns, a run's selection is their union** — every cell of those rows, plus
every cell of those columns.

## Recipes

### Ingest a document and get its pages

```
Trigger → Ragextract (File → Upload) → Ragextract (File → Get Items)
```

Point **Upload** at a binary property (`data`) or a public URL. It waits for ingest and outputs the
file, so **Get Items** can take `{{ $json.id }}` as its File. Set **Page Format** to `jpg` and
**Download Files** on to get page images out the other side.

### Semantic search over a workspace

```
Trigger → Ragextract (File → Search) → AI Agent
```

**Search** returns the matching pages with a relevance score and a signed link each. Leave **File
IDs** empty to search the whole workspace, or narrow it to specific documents. With **Download
Files** on, each match arrives with its page attached.

### Pull a structured table out of a batch of documents

```
Ragextract (Table → Create)
  → Ragextract (Table Column → Create)   ← one per question
  → Ragextract (Table Row → Create)      ← one per file
  → Ragextract (Table Run → Preview)     ← what will this cost?
  → Ragextract (Table Run → Start)       ← waits, returns the cells
```

Each column is a prompt plus an output type (`date`, `number`, `categorical`, `boolean`,
`text_quote`, `list_scalar`, `image`). Cells come back with the value, a confidence score and
[citations](https://ragextract.com/docs/citations) pointing at the page and quote they came from.

Set a table to **Standing** and it runs itself against every new file uploaded to the workspace.

### Treat a contract and its amendments as one subject

```
Ragextract (Bundle → Create) → Ragextract (Bundle → Add Files) → Ragextract (Table Row → Create)
```

Create the row with **Subject Type** `bundle`. Mark the master document **Primary** and give each
amendment an **Effective At** date; the extraction resolves them in precedence order and
**Table Cell → Get Facts** shows what each document contributed. See
[Bundles](https://ragextract.com/docs/bundles).

## Using it as an AI agent tool

The node is available to AI Agent nodes as a tool. **File → Search** is the obvious one to expose —
it lets an agent look things up across your documents without you building a retrieval chain — but
any operation works, and the agent can fill parameters itself.

## Upgrading from 0.1.x

**0.2.0 targets the v2 API and is a breaking change.** Existing Ragextract nodes need reconfiguring:

| 0.1.x | 0.2.0 |
| --- | --- |
| *(nothing)* | Every operation now takes a **Workspace** |
| Workspace → Extract / Vectorize | **File → Upload** (always embeds) |
| Workspace → Search | **File → Search** |
| Dataset → * | **File → \*** |
| Dataset → Vectorize | *gone* — upload embeds |
| `{{ $json.data.id }}` | `{{ $json.id }}` — output is no longer wrapped |

New in 0.2.0: the Table, Table Column, Table Row, Table Cell, Table Run and Bundle resources,
workspace CRUD, multipart upload, and a configurable base URL.

The v1 API is unchanged and still served; only this node moved.

## Support

* [Issue tracker](https://github.com/subworkflow-ai/n8n-nodes-ragextract/issues) — bugs and feature
  requests for this node
* [ragextract.com/support](https://ragextract.com/support) — account, billing and product help
* [support@subworkflow.ai](mailto:support@subworkflow.ai)

## Licence

MIT

## Resources

* [Quickstart](https://ragextract.com/docs/quickstart)
* [API reference](https://ragextract.com/developers/api)
* [Tables](https://ragextract.com/docs/tables) · [Bundles](https://ragextract.com/docs/bundles) · [Credits](https://ragextract.com/docs/credits) · [Limits](https://ragextract.com/docs/limits)
* [Ragextract JS SDK](https://github.com/subworkflow-ai/ragextract-js) for programmatic usage
