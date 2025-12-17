#!/usr/bin/env node
/**
 * Postbuild script to restructure output for baseURL
 * Moves .output/public/* to .output/public/uidev/*
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseURL = process.env.URL_PREFIX || '/uidev/';
const cleanBaseURL = baseURL.replace(/^\//, '').replace(/\/$/, ''); // Remove leading/trailing slashes

if (!cleanBaseURL) {
    console.log('No baseURL prefix, skipping restructure');
    process.exit(0);
}

const publicDir = path.join(__dirname, '../.output/public');
const tempDir = path.join(__dirname, '../.output/temp');
const targetDir = path.join(publicDir, cleanBaseURL);

console.log(`Restructuring output for baseURL: /${cleanBaseURL}/`);

try {
    // Create temp directory and move all files there
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Move everything from public to temp
    const items = fs.readdirSync(publicDir);
    items.forEach(item => {
        if (item !== 'temp') {
            const src = path.join(publicDir, item);
            const dest = path.join(tempDir, item);
            fs.renameSync(src, dest);
        }
    });

    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Move everything from temp to target
    const tempItems = fs.readdirSync(tempDir);
    tempItems.forEach(item => {
        const src = path.join(tempDir, item);
        const dest = path.join(targetDir, item);
        fs.renameSync(src, dest);
    });

    // Clean up temp
    fs.rmSync(tempDir, { recursive: true });

    console.log(`✓ Files moved to /${cleanBaseURL}/`);
} catch (error) {
    console.error('Error restructuring output:', error);
    process.exit(1);
}
