import { config } from './cli.js';
import { readFileSync } from 'fs';

const fileName = config.template;
const getTemplate = () => {
	try {
		return readFileSync(fileName, 'utf-8');
	} catch {
		return readFileSync('templates/proctoroom.html', 'utf-8');
	}
};

export const template = getTemplate();
