import  posthtml from 'posthtml';
import  inlineHtml from 'posthtml-inline-css';
import inlineAssets from 'posthtml-inline-assets';
import  { unified } from 'unified';
import  remarkParse from 'remark-parse';
import  remarkRehype from 'remark-rehype';
import  rehypeFormat from 'rehype-format';
import  rehypeStringify from 'rehype-stringify';
import  { noopener } from 'posthtml-noopener';
import rehypeShiki from 'rehype-shiki'
import tidy from 'posthtml-tidy'
import removeTags from 'posthtml-remove-tags';


async function transform({markdown, customCss }: { markdown:string, customCss: string }) {
	const output = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.data('settings', { fragment: true })
		
		.use(rehypeShiki)
		.use(rehypeFormat)
		.use(rehypeStringify)
		.process(markdown);
	
	const html = `
        <style>
        
        ${customCss}
		</style>
        ${output}
        
    `;
	
	const result = await posthtml([
		inlineHtml(),
		inlineAssets(),
		removeTags({tags: ['style', 'script']}),
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
	return result.html;
}

import { Handler  } from '@netlify/functions';
export const handler: Handler = async(event) => {
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "POST",
	};
	if(event.httpMethod  ===  'OPTIONS') {
		return  {
			statusCode: 204,
			headers,
			body: ''
		}
	}	
	if(event.httpMethod === 'POST') {
		const { body } = event
		const { markdown, css } = JSON.parse(body ?? '')
		
		const result = await transform({ markdown: markdown ?? '', customCss: css ?? ''});
		
		return {
			statusCode: 200,
			body: result,
			headers
		};	
	}
	return {
		statusCode: 500,
		body:''
	}
	
	
}
