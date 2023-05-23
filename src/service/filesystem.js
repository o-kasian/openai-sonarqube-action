const fs = require('fs');
const path = require('path');

const constructFilesystemService = (config) => {

    const loadFile = async(filename) => {
        const filePath = path.join(config.sourcesDir, filename);
        const data = await fs.promises.readFile(filePath);
        return data.toString('utf-8');
    }
    
    const writeFile = async(filename, content) => {
        const filePath = path.join(config.outputDir, filename);
        const fileDir = path.dirname(filePath);
        fs.mkdirSync(fileDir, { recursive: true });
        await fs.promises.writeFile(filePath, content, 'utf-8');
    }

    return {
        loadFile,
        writeFile
    };
};

module.exports = constructFilesystemService;