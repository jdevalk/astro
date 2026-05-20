import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { astroFrontmatterScanPlugin } from '../../dist/esbuild-plugin-astro-frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Helper that runs the esbuild plugin's onLoad handler via a mock esbuild build object.
 * Captures the registered onLoad callback and invokes it with a given path.
 */
function getOnLoadHandler(plugin: ReturnType<typeof astroFrontmatterScanPlugin>) {
	let handler: ((args: { path: string; namespace: string }) => Promise<any>) | undefined;

	const mockBuild = {
		onLoad(
			options: { filter: RegExp; namespace?: string },
			callback: (args: { path: string; namespace: string }) => Promise<any>,
		) {
			handler = callback;
		},
		onResolve() {},
	};

	plugin.setup(mockBuild as any);
	return handler!;
}

describe('astroFrontmatterScanPlugin', () => {
	const plugin = astroFrontmatterScanPlugin();

	it('includes resolveDir in onLoad result for .astro files with frontmatter', async () => {
		const handler = getOnLoadHandler(plugin);

		// Use the existing test fixture's Duration.astro which has `import ms from 'ms'`
		const fixturePath = join(__dirname, '..', 'fixtures', 'ssr-deps', 'src', 'components', 'Duration.astro');
		const result = await handler({ path: fixturePath, namespace: 'file' });

		assert.ok(result, 'onLoad should return a result');
		assert.equal(result.loader, 'ts');
		assert.ok(result.contents.includes('ms'), 'contents should include the frontmatter code referencing ms');
		assert.ok(result.contents.includes('export default {}'), 'contents should include default export');
		assert.equal(
			result.resolveDir,
			dirname(fixturePath),
			'resolveDir should be the directory containing the .astro file',
		);
	});

	it('includes resolveDir in onLoad result for .astro files without frontmatter', async () => {
		const handler = getOnLoadHandler(plugin);

		// Use a path that doesn't exist or has no frontmatter — the catch block
		// returns a fallback with resolveDir too
		const fakePath = join(__dirname, '..', 'fixtures', 'ssr-deps', 'src', 'pages', 'nonexistent.astro');
		const result = await handler({ path: fakePath, namespace: 'file' });

		assert.ok(result, 'onLoad should return a result');
		assert.equal(result.loader, 'ts');
		assert.equal(result.contents, 'export default {}');
		assert.equal(
			result.resolveDir,
			dirname(fakePath),
			'resolveDir should be set even for fallback result',
		);
	});

	it('strips top-level return statements from frontmatter', async () => {
		const handler = getOnLoadHandler(plugin);

		const fixturePath = join(__dirname, '..', 'fixtures', 'top-level-return', 'src', 'pages', 'index.astro');
		const result = await handler({ path: fixturePath, namespace: 'file' });

		assert.ok(result, 'onLoad should return a result');
		// The frontmatter should have returns replaced with throws
		assert.ok(!result.contents.includes('\nreturn;'), 'bare return statements should be replaced');
	});
});
