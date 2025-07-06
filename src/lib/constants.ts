import { homedir } from "os";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let home = homedir();
export const SDO_HOME = `${home}/.sdo`;

export const rootPathToAnsible = () => {
    const rootPath = path.join(dirname(__dirname), '/..');
    return process.env.NODE_ENV === "development" ? path.join(rootPath, '/ansible') : path.join(rootPath, '/dist/ansible');
}