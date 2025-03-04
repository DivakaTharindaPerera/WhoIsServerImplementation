const fs = require('fs');

// uses regex patterns to extract the required data in efficient way
// REGEX patterns
const patterns = {
    domain: /Domain name:\s*(\S+)/i,
    creationDate: /Creation Date:\s*([\d-]+)/i,
    updateDate: /Updated Date:\s*([\d-]+)/i,
    status: /Status:\s*(.+)/i,
    registrar: /Registrar:\s*([\s\S]*?)(?=\n(?:Abuse Contact|Reseller|DNSSEC|$))/i,
    isFreeRegex: /^([^\s]+)\s+is free/,
};

// function to get data from single file
function parserFunction(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const data = {
        domainName: '',
        creationDate: '',
        updateDate: '',
        status: '',
        registrar: '',
    }

    data.domainName = (content.match(patterns.domain) || [, ''])[1].trim();
    data.creationDate = (content.match(patterns.creationDate) || [, ''])[1].trim();
    data.updateDate = (content.match(patterns.updateDate) || [, ''])[1].trim();
    data.status = (content.match(patterns.status) || [, ''])[1].trim();
    data.registrar = (content.match(patterns.registrar) || [, ''])[1].trim().replace(/\s+/g, ' ');

    return data;
}

module.exports = parserFunction;