import posthtml from 'posthtml';
import inlineHtml from 'posthtml-inline-css';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import shiki from 'rehype-shiki';
import { noopener } from 'posthtml-noopener';
import tidy from 'posthtml-tidy';

async function transform(markdown) {
	const output = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.data('settings', { fragment: true })
		.use(shiki)
		//.use(rehypeSanitize, defaultSchema)
		//.use(rehypeDocument)
		.use(rehypeFormat)
		.use(rehypeStringify)
		.process(markdown);

	const html = `
        <html>
        <head>
        <style>
        
        blockquote {
            border-left: 3px #999 solid;
            padding: 0.5rem
        }
        </style>
        </head>
        <body>
            ${output}
        </body>
        </html>
    `;
	const result = await posthtml([
		inlineHtml(),
		tidy({
			log: false,
			rules: {
				doctype: 'omit',
				hideComments: true,
				dropEmptyElements: true
				// more options...
			}
		}),
		noopener()
	]).process(html);
	return result;
}

export async function handler(event, context) {
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "POST",
	};
	if(event.httpMethod  ===  'OPTIONS') {
		console.log('Pre-flight')
		return  {
			statusCode: 204,
			headers,
			body: {}
		}
	}	
	if(event.httpMethod === 'POST') {
		const { body } = event
		const result = await transform(body);
		console.log('POST request')
		return {
			statusCode: 200,
			body: String(result),
			headers
		};	
	}
	
	
}
