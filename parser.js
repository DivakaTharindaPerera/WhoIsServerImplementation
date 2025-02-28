const fs = require('fs');

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

    // since whois-isfree.txt has a different format, we need to parse it separately
    // considering "palinda.nl is free" represents,
    // "palinda.nl" as the domain name and "free" as the status
    const isFreeMatch = content.match(patterns.isFreeRegex);
    if (isFreeMatch) {
        if(data.domainName === ''){
            data.domainName = isFreeMatch[1].trim();
        }
        if(data.status === ''){
            data.status = 'free';
        }
    }

    return data;
}

module.exports = parserFunction;