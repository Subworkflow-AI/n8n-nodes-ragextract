# n8n-nodes-ragextract

The official n8n node for Ragextract, a document processing and RAG service for large documents.

## Features
* **Handles Documents up to 1gb** Protect the stability of your instance by offloading CPU intensive document processing work.
* **Granular Page Retrieval** No need to hold everything in memory. Fetches only the pages you need in the formats you need.
* **Automated Embeddings and Search** Save time by avoiding adhoc embedding workflows for every project.
* **Small and High Frequency Use-cases also Supported** Unmetered page counts and retrievals help build more durable workflows without surprises.

## Installation

### Cloud and Self-hosted
Install via the **Settings > Community Nodes** page in your n8n instance.

### Self-hosted CLI
```
npm install n8n-nodes-ragextract
```

## Credentials

You will need a Ragextract account and API key to use this node.
* Sign up at https://ragextract.com
* Go to **Workspaces > Settings > Keys > Create API Key**
* Copy this API Key

## Licence

MIT

## Resources

* [Ragextract Getting Started Gude](https://docs.ragextract.com/getting-started)
* [Official Ragextract API Reference](https://docs.ragextract.com/category/api-reference)
* [Ragextract JS SDK for programmatic usage](https://github.com/subworkflow-ai/ragextract-js)