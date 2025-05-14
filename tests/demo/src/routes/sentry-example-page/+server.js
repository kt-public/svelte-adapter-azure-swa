// This is just a very simple API route that throws an example error.
// Feel free to delete this file and the entire sentry route.

import { CosmosClient } from '@azure/cosmos';

export const GET = async () => {
	const cosmosdb = new CosmosClient({});
	console.log(cosmosdb);
	throw new Error('Sentry Example API Route Error');
};
