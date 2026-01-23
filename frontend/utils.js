import React from 'react';
import htm from 'htm';

export const html = htm.bind(React.createElement);

/**
 * Bundles a multi-file project into a single HTML string for iframe viewing.
 * 
 * @param {Array<{name: string, content: string}>} files - Array of file objects
 * @returns {string} - The bundled HTML string
 */
export const bundleProject = (files) => {
    if (!Array.isArray(files) || files.length === 0) return '';
    
    // Find index.html
    const indexFile = files.find(f => f.name.toLowerCase() === 'index.html') || files[0];
    let htmlContent = indexFile.content;

    // Helper to get file content by name
    const getFileContent = (filename) => {
        const file = files.find(f => f.name.toLowerCase() === filename.toLowerCase());
        return file ? file.content : null;
    };

    // Replace <link rel="stylesheet" href="..."> with <style>...</style>
    htmlContent = htmlContent.replace(/<link\s+[^>]*href=["'](.*?)["'][^>]*rel=["']stylesheet["'][^>]*>/gi, (match, href) => {
        const cssContent = getFileContent(href);
        return cssContent ? `<style>\n${cssContent}\n</style>` : match;
    });

    // Replace <script src="..."></script> with <script>...</script>
    htmlContent = htmlContent.replace(/<script\s+[^>]*src=["'](.*?)["'][^>]*>\s*<\/script>/gi, (match, src) => {
        // Skip external scripts (http/https)
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
            return match;
        }
        const jsContent = getFileContent(src);
        return jsContent ? `<script>\n${jsContent}\n</script>` : match;
    });

    return htmlContent;
};
