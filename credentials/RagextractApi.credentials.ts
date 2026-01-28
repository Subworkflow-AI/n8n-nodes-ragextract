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

	icon: Icon = { light: 'file:../icons/subworkflow-ai.svg', dark: 'file:../icons/subworkflow-ai.dark.svg' };

	documentationUrl = 'https://docs.ragextract.com/auth';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

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
			baseURL: 'https://api.ragextract.com/v1',
			url: '/verify',
			method: 'GET',
		},
	};
}
