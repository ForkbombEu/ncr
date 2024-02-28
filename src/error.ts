import { Logger, type ILogObj } from 'tslog';
import { Endpoints } from './types';

export const reportZenroomError = (error: Error, l: Logger<ILogObj>, endpoints: Endpoints): string => {

    if (error.name === 'ZenroomError') {
        debugZen('J64 HEAP: ', l, error);
        debugZen('J64 TRACE: ', l, error);

        return error.message
    } else if (error.message.startsWith('ParseError')) {
        l.error('Slangroom Syntax Error ', error.message);
        return error.message
    } else {
        l.error(error);
        return error.message
    }
}

const debugZen = (type: 'J64 TRACE: ' | 'J64 HEAP: ', l: Logger<ILogObj>, error: Error) => {
    const trace = JSON.parse(error.message).filter((l: string) => l.startsWith(type));
    if (trace.length) {
        const content = trace[0].split(type)[1].replaceAll("'", '');
        const decodedContent = Buffer.from(content, 'base64').toString('utf8');
        console.table(JSON.parse(decodedContent))
    }
}