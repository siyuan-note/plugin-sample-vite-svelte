import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

// Explicit traversal keeps cleanup reliable for Windows/MSYS paths.
function removePath(path) {
    if (!existsSync(path)) {
        return;
    }

    if (lstatSync(path).isDirectory()) {
        for (const entry of readdirSync(path)) {
            removePath(join(path, entry));
        }
        rmdirSync(path);
        return;
    }

    unlinkSync(path);
}

for (const path of ["dist", "package.zip"]) {
    removePath(path);
}
