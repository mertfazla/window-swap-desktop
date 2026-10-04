const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const forbidden = /^(?:dist\/|out\/|\.next\/|node_modules\/|\.?private\/|app\/data\/backup\/|app\/data\/.*(?:\.js$|\.local\.|temp\.json$))|(?:^|\/)\.env(?:\.|$)|\.dpapi$/i;
const staged = git('ls-files', '-z').split('\0').filter(Boolean);
const historical = git('log', '--all', '--pretty=format:', '--name-only').split(/\r?\n/).filter(Boolean);
const rejected = [...new Set([...staged, ...historical].filter(path => forbidden.test(path)))];
if (rejected.length) {
    console.error('Private data or build artifacts are tracked or present in history:', rejected);
    process.exit(1);
}

const allowed = new Set(['url1', 'url2', 'cityLocation', 'countryLocation', 'Latitude', 'Longitude', 'Interiors', 'Snow', 'Animals', 'City', 'Rain', 'Nature', 'Night', 'date']);
function checkCatalog(source, label) {
    const catalog = JSON.parse(source);
    if (!Array.isArray(catalog)) throw new Error(`${label}: catalog must be an array.`);
    for (const entry of catalog) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).some(key => !allowed.has(key))) {
            throw new Error(`${label}: unexpected catalog fields; contact information and tokens are prohibited.`);
        }
        if (typeof entry.url1 !== 'string' || !/^\d+$/.test(entry.url1) || (entry.url2 !== undefined && (typeof entry.url2 !== 'string' || !/^[a-f0-9]+$/i.test(entry.url2)))) {
            throw new Error(`${label}: invalid Vimeo ID or hash.`);
        }
        if (typeof entry.cityLocation !== 'string' || !Number.isFinite(entry.Latitude) || Math.abs(entry.Latitude) > 90 || !Number.isFinite(entry.Longitude) || Math.abs(entry.Longitude) > 180) {
            throw new Error(`${label}: invalid location.`);
        }
        if (JSON.stringify(entry).includes('@')) throw new Error(`${label}: possible contact information.`);
    }
}
try {
    checkCatalog(fs.readFileSync('app/data/catalog.json', 'utf8'), 'Working catalog');
    if (staged.includes('app/data/catalog.json')) checkCatalog(git('show', ':app/data/catalog.json'), 'Staged catalog');
    for (const commit of git('rev-list', '--all', '--', 'app/data/catalog.json').split(/\r?\n/).filter(Boolean)) {
        checkCatalog(git('show', `${commit}:app/data/catalog.json`), 'Historical catalog');
    }
    console.log('Publication checks passed: no forbidden tracked paths; catalog fields validated. Content rights and coordinates still require human review.');
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
