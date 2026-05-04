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

    const normalizePath = (path) => {
        if (!path) return '';
        // Strip ./ and leading /
        return path.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
    };

    // Helper to get file content by name
    const getFileContent = (path) => {
        const normalized = normalizePath(path);
        const file = files.find(f => normalizePath(f.name) === normalized);
        return file ? file.content : null;
    };

    // Flexible CSS detector
    htmlContent = htmlContent.replace(/<link\s+([^>]*?)>/gi, (match, attrs) => {
        const isStylesheet = /rel=["']stylesheet["']/i.test(attrs);
        if (!isStylesheet) return match;
        
        const hrefMatch = /href=["'](.*?)["']/i.exec(attrs);
        const href = hrefMatch ? hrefMatch[1] : null;
        
        if (!href || href.startsWith('http') || href.startsWith('//')) return match;
        
        const cssContent = getFileContent(href);
        return cssContent ? `<style data-original-href="${href}">\n${cssContent}\n</style>` : match;
    });

    // Flexible JS detector
    htmlContent = htmlContent.replace(/<script\s+([^>]*?)>\s*<\/script>/gi, (match, attrs) => {
        const srcMatch = /src=["'](.*?)["']/i.exec(attrs);
        const src = srcMatch ? srcMatch[1] : null;
        
        if (!src || src.startsWith('http') || src.startsWith('//')) return match;
        
        const jsContent = getFileContent(src);
        return jsContent ? `<script data-original-src="${src}">\n${jsContent}\n</script>` : match;
    });

    // Inject Console Interceptor
    const consoleInterceptor = `
    <script>
        (function() {
            const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
            };
            
            function sendToParent(type, args) {
                window.parent.postMessage({
                    type: 'iframe_console',
                    logType: type,
                    args: Array.from(args).map(arg => {
                        try {
                            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                        } catch(e) {
                            return String(arg);
                        }
                    })
                }, '*');
            }

            console.log = function() { sendToParent('log', arguments); originalConsole.log.apply(console, arguments); };
            console.warn = function() { sendToParent('warn', arguments); originalConsole.warn.apply(console, arguments); };
            console.error = function() { sendToParent('error', arguments); originalConsole.error.apply(console, arguments); };
            console.info = function() { sendToParent('info', arguments); originalConsole.info.apply(console, arguments); };
            
            window.onerror = function(message, source, lineno, colno, error) {
                sendToParent('error', [message + ' (at ' + lineno + ':' + colno + ')']);
            };
        })();
    </script>
    `;

    // Insert interceptor at the beginning of <head> or <html>
    if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', '<head>' + consoleInterceptor);
    } else if (htmlContent.includes('<html>')) {
        htmlContent = htmlContent.replace('<html>', '<html>' + consoleInterceptor);
    } else {
        htmlContent = consoleInterceptor + htmlContent;
    }

    return htmlContent;
};
