#!/usr/bin/env node

import { main } from './index.js';

function exitWithCode(code: number): never {
	const proc = (
		globalThis as {
			process?: { exit?: (nextCode?: number) => never };
		}
	).process;
	if (proc?.exit) {
		return proc.exit(code);
	}
	throw new Error(`Process exited with code ${code}`);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	exitWithCode(1);
});
