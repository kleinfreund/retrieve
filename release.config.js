import { readFileSync } from 'node:fs'

const commitPartial = readFileSync('./changelog-template-commit.hbs', { encoding: 'utf-8' })

/**
 * Adds the commit body line by line so I can add it with the correct indentation in `changelog-template-commit.hbs`.
 */
function finalizeContext (context) {
	for (const commitGroup of context.commitGroups) {
		for (const commit of commitGroup.commits) {
			commit.bodyLines = commit.body?.split('\n').filter((line) => line !== '') ?? []
		}
	}

	return context
}

/** @type {import('semantic-release').Options} */ const options = {
	branches: [
		'main',
	],
	plugins: [
		// This analyzes all new commits and determines whether to release a new version.
		// https://github.com/semantic-release/commit-analyzer
		'@semantic-release/commit-analyzer',

		// This takes the releasing commits’ messages and compiles release notes to be used for the CHANGELOG.md file and the GitHub release.
		// https://github.com/semantic-release/release-notes-generator
		['@semantic-release/release-notes-generator', {
			preset: 'conventionalcommits',
			writerOpts: {
				commitPartial,
				finalizeContext,
			},
		}],

		// This creates/updates the CHANGELOG.md file.
		// https://github.com/semantic-release/changelog
		'@semantic-release/changelog',

		// This updates the package.json and package-lock.json files with the new version number.
		// https://github.com/semantic-release/npm
		'@semantic-release/npm',

		// This creates a GitHub release and attaches assets to it.
		// https://github.com/semantic-release/github
		['@semantic-release/github', {
			assets: [
				{ path: 'dist/retrieve.d.ts' },
				{ path: 'dist/retrieve.js' },
			],
		}],

		// This creates a release commit in the git repository.
		// https://github.com/semantic-release/git
		'@semantic-release/git',
	],
}

export default options
