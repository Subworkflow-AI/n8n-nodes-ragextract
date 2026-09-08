import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RagextractApi implements ICredentialType {
	name = 'ragextractApi';

	displayName = 'Ragextract API';

	icon: Icon = {
		light: 'file:../icons/ragextract.svg',
		dark: 'file:../icons/ragextract.dark.svg',
	};

	documentationUrl = 'https://ragextract.com/developers/api/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'psk_…',
			description:
				'A personal API key (psk_…) reaches every workspace its owner can. A workspace key (sk_…) also works, pinned to the one workspace it belongs to.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.ragextract.com',
			description: 'API host, without the version segment. Change this only for a private deployment.',
		},
	];

	// The key never travels in a query string: that would leak the credential into access logs,
	// browser history and referrers. `/v2` accepts the header alone.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl || "https://api.ragextract.com"}}/v2',
			url: '/verify',
			method: 'GET',
		},
	};
}
