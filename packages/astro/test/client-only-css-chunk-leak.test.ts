import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('client:only CSS does not leak across pages when chunk merging occurs', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/client-only-css-chunk-leak/',
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	function getStylesheetHrefs(html: string): string[] {
		const $ = cheerioLoad(html);
		return $('link[rel=stylesheet]')
			.map((_i, el) => $(el).attr('href'))
			.get()
			.filter((href): href is string => href != null);
	}

	it('does not attach CSS to pages that do not use the CSS-importing client:only component', async () => {
		const aboutHtml = await fixture.readFile('/about/index.html');
		const aboutHrefs = getStylesheetHrefs(aboutHtml);
		// About page only has CurrentTime (no CSS imports), so should have no stylesheets
		assert.equal(aboutHrefs.length, 0, `About page should have no CSS, but got: ${aboutHrefs.join(', ')}`);
	});

	it('keeps CSS on the page that uses the CSS-importing client:only component', async () => {
		const indexHtml = await fixture.readFile('/index.html');
		const indexHrefs = getStylesheetHrefs(indexHtml);
		// Home page has HeavyWidget which imports StyledPanel.css
		assert.ok(indexHrefs.length > 0, 'Home page should have at least one stylesheet');

		// Verify the CSS actually contains the styled-panel styles
		const allCss = await Promise.all(indexHrefs.map((href) => fixture.readFile(href)));
		const combined = allCss.join('\n');
		assert.match(combined, /#9acd32/, 'Home page CSS should contain the styled-panel background color');
	});
});
