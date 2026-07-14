import React, { useMemo, useRef, useEffect, useCallback, memo } from 'react';

interface AppViewProps {
  sandboxUrl?: string;
  files?: any[];
  envId?: string | null;
  projectName?: string;
  theme?: 'light' | 'dark';
  onIframeRef?: (iframe: HTMLIFrameElement | null) => void;
  selectedFile?: any;
}

export const AppView = memo(function AppView({ sandboxUrl, files, envId, projectName, theme = 'light', onIframeRef, selectedFile }: AppViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  console.log("[AppView Component Debug] Rendering AppView with props:", {
    sandboxUrl,
    filesCount: files?.length,
    selectedFile: selectedFile?.name,
    envId,
    projectName
  });

  const srcDoc = useMemo(() => {
    if (files && files.length > 0) {
      const isHtml = (f: any) => f.name && (f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));
      const activeHtmlFile = (selectedFile && isHtml(selectedFile)) 
        ? selectedFile 
        : files.find(f => isHtml(f) || f.name === 'index.html');

      if (activeHtmlFile && activeHtmlFile.content) {
        console.log(`[AppView] Assembling srcDoc for file: ${activeHtmlFile.name} (length: ${activeHtmlFile.content.length} chars)`);
        let content = activeHtmlFile.content;
        
        // Inject sandbox markers at the top of the head so any client scripts in the iframe can access them
        const injectScript = `\n<script id="sandbox-metadata">
  window.__sandboxEnvId = ${JSON.stringify(envId || '')};
  window.__sandboxWorkspaceName = ${JSON.stringify(projectName || '')};

  // Focus & Selection Guard: Automatically preserves input states across any DOM rerender
  (function() {
    var lastActiveInfo = null;

    function updateLastActive(el) {
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        var selStart = null;
        var selEnd = null;
        try {
          selStart = el.selectionStart;
          selEnd = el.selectionEnd;
        } catch (e) {}

        lastActiveInfo = {
          id: el.id || null,
          tagName: el.tagName,
          name: el.getAttribute('name') || null,
          placeholder: el.getAttribute('placeholder') || null,
          type: el.getAttribute('type') || null,
          className: el.className || '',
          value: el.value,
          selectionStart: selStart,
          selectionEnd: selEnd,
          timestamp: Date.now()
        };
      }
    }

    document.addEventListener('focusin', function(e) {
      updateLastActive(e.target);
    }, true);

    document.addEventListener('input', function(e) {
      if (document.activeElement === e.target) {
        updateLastActive(e.target);
      }
    }, true);

    document.addEventListener('selectionchange', function() {
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        updateLastActive(activeEl);
      }
    });

    function findBestMatchingElement(container, orig) {
      if (!orig) return null;
      if (orig.id) {
        var el = document.getElementById(orig.id) || container.querySelector('#' + orig.id);
        if (el) return el;
      }

      var candidates = Array.from(container.querySelectorAll(orig.tagName));
      if (candidates.length === 0) return null;

      var bestCandidate = null;
      var highestScore = -1;

      for (var i = 0; i < candidates.length; i++) {
        var cand = candidates[i];
        var score = 0;
        if (orig.name && cand.getAttribute('name') === orig.name) score += 10;
        if (orig.placeholder && cand.getAttribute('placeholder') === orig.placeholder) score += 8;
        if (orig.type && cand.getAttribute('type') === orig.type) score += 5;
        if (orig.className && cand.className === orig.className) score += 3;

        if (score > highestScore) {
          highestScore = score;
          bestCandidate = cand;
        }
      }

      return bestCandidate || candidates[0];
    }

    // Proxy innerHTML setter to restore focus immediately
    try {
      var originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      if (originalDescriptor && originalDescriptor.set) {
        Object.defineProperty(Element.prototype, 'innerHTML', {
          configurable: true,
          enumerable: true,
          get: originalDescriptor.get,
          set: function(html) {
            var activeEl = document.activeElement;
            var isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            if (isInput && this.contains(activeEl)) {
              updateLastActive(activeEl);
              var info = lastActiveInfo;
              originalDescriptor.set.call(this, html);

              setTimeout(function() {
                var restored = findBestMatchingElement(document.body, info);
                if (restored) {
                  restored.value = info.value;
                  restored.focus();
                  if (info.selectionStart !== null && info.selectionEnd !== null) {
                    try {
                      restored.setSelectionRange(info.selectionStart, info.selectionEnd);
                    } catch (e) {}
                  }
                }
              }, 0);
            } else {
              originalDescriptor.set.call(this, html);
            }
          }
        });
      }
    } catch (e) {
      console.warn('innerHTML intercept error:', e);
    }

    // Real-time Collaborative Cursor Tracking postMessage dispatcher
    try {
      var lastSentMessage = 0;
      document.addEventListener('mousemove', function(e) {
        var now = Date.now();
        if (now - lastSentMessage < 50) return;
        lastSentMessage = now;
        if (window.parent) {
          window.parent.postMessage({
            type: 'iframe_mousemove',
            clientX: e.clientX,
            clientY: e.clientY
          }, '*');
        }
      });
    } catch (e) {
      console.warn('Cursor tracking postMessage injection error:', e);
    }
  })();
</script>\n`;

        if (content.includes('<head>')) {
          content = content.replace('<head>', `<head>${injectScript}`);
        } else if (content.includes('<html>')) {
          content = content.replace('<html>', `<html><head>${injectScript}</head>`);
        } else {
          content = injectScript + content;
        }

        // Inline css
        content = content.replace(/<link\s+([^>]*?)>/ig, (match, attrs) => {
          if (attrs.toLowerCase().includes('rel="stylesheet"') || attrs.toLowerCase().includes("rel='stylesheet'")) {
             const hrefMatch = attrs.match(/href=["']?([^"'\s>]+)["']?/i);
             if (hrefMatch && hrefMatch[1]) {
                const href = hrefMatch[1];
                if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                   return match;
                }
                let matchedFile = files.find(f => f.name === href || href.endsWith('/' + f.name) || f.name.endsWith('/' + href) || href === `./${f.name}`);
                if (!matchedFile && href.toLowerCase().endsWith('.css')) {
                   matchedFile = files.find(f => f.name && f.name.toLowerCase().endsWith('.css'));
                }
                if (matchedFile && matchedFile.content) {
                   return `<style>\n${matchedFile.content}\n</style>`;
                }
             }
          }
          return match;
        });

        // Inline js
        content = content.replace(/<script([^>]*)>[\s\S]*?<\/script>/ig, (match, attrs) => {
          const srcMatch = attrs.match(/src=["']?([^"'\s>]+)["']?/i);
          if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
               return match;
            }
            let matchedFile = files.find(f => f.name === src || src.endsWith('/' + f.name) || f.name.endsWith('/' + src) || src === `./${f.name}`);
            if (!matchedFile && src.toLowerCase().match(/\.(js|jsx|ts|tsx)$/)) {
               matchedFile = files.find(f => f.name && f.name.toLowerCase().match(/\.(js|jsx|ts|tsx)$/));
            }
            if (matchedFile && matchedFile.content) {
              const otherAttrs = attrs.replace(/src=["']?[^"'\s>]+["']?/i, '');
              return `<script${otherAttrs}>\n${matchedFile.content}\n</script>`;
            }
          }
          return match;
        });


        return content;
      }
    }
    return undefined;
  }, [files, selectedFile]);

  const isSelfOrigin = (url?: string) => {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin || parsed.host === window.location.host;
    } catch (e) {
      return url.includes(window.location.host) || url.includes('localhost:3000');
    }
  };

  const validExternalSandboxUrl = (sandboxUrl && !isSelfOrigin(sandboxUrl)) ? sandboxUrl : undefined;
  const showIframe = Boolean(validExternalSandboxUrl || srcDoc);

  const isDark = theme === 'dark';

  return (
    <div className="w-full h-full p-0 overflow-hidden">
      {!showIframe ? (
        <div className={`w-full h-full ${isDark ? 'bg-[#131416] text-gray-400' : 'bg-white text-gray-400'} flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-rounded text-3xl animate-spin text-blue-500">sync</span>
            <p className="text-sm font-medium">Waiting for application code generation...</p>
          </div>
        </div>
      ) : (
        <iframe
          ref={(el) => {
            // @ts-ignore
            iframeRef.current = el;
            if (onIframeRef) onIframeRef(el);
          }}
          src={validExternalSandboxUrl}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals allow-downloads"
          className="w-full h-full bg-white border-none outline-none"
          title="Sandbox Preview"
        />
      )}
    </div>
  );
});
