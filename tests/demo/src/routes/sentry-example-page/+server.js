// This is just a very simple API route that throws an example error.
// Feel free to delete this file and the entire sentry route.

import { CosmosClient } from '@azure/cosmos';

export const GET = async (event) => {
	event.platform?.context.log('Sentry Example API Route');
	try {
		event.platform?.context.warn(
			'Trying to create CosmosClient, should fail, cause we provide no config'
		);
		const cosmosClient = new CosmosClient({});
		console.log('CosmosClient created', cosmosClient);
	} catch (error) {
		event.platform?.context.error('Error creating CosmosClient', error);
	}
	throw new Error('Sentry Example API Route Error');
};
