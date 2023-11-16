import { program } from '../src/cli';

const res = {
	debug: false,
	hostname: '0.0.0.0',
	openapiPath: '/docs',
	port: 0,
	template: './applet_template.html',
	zencodeDirectory: '/home/puria/src/github.com/forkbombeu/ncr/contracts',
	zenroomVersion: '4.2.1'
};

describe('some test command', () => {
	it('should return the default values of options', async () => {
		expect(program).toBeDefined();
		expect(program.parse().opts()).toEqual(res);
	});
});
