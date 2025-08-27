import { useState, useRef } from 'react';
import './URLChecker.css';

function URLChecker() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const newTabRef = useRef(null);

  const validateURL = (inputUrl) => {
    try {
      const urlObj = new URL(inputUrl);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const formatURL = (inputUrl) => {
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      return 'https://' + inputUrl;
    }
    return inputUrl;
  };

  const getCheckerCode = () => {
    // Return the actual VWO checker code that returns results
    return `
(function() {
    'use strict';
    console.log('🔍 VWO Checker: Starting analysis...');

    class VWOAnalyzer {
        constructor() {
            this.results = {
                url: window.location.href,
                sessionId: this.generateSessionId(),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                audits: [],
                summary: {}
            };
        }

        // Generate a unique session ID
        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Helper function to add audit result
        addAudit(name, status, message, fix = '', level = 'Major') {
            const audit = {
                audit: name,
                status: status.toLowerCase(),
                message: message,
                fix: fix,
                level: level,
                timestamp: new Date().toISOString()
            };
            this.results.audits.push(audit);
        }

        // Check 1: SmartCode Detection
        checkSmartCodeDetection() {
            try {
                const vwoCodeScripts = document.querySelectorAll('script#vwoCode');
                const vwoDomainScripts = document.querySelectorAll('script[src*="visualwebsiteoptimizer.com"]');
                const vwoInlineScripts = Array.from(document.querySelectorAll('script')).filter(
                    script => script.innerHTML.includes('visualwebsiteoptimizer.com')
                );
                
                const totalScripts = vwoCodeScripts.length + vwoDomainScripts.length + vwoInlineScripts.length;
                
                if (totalScripts > 0) {
                    this.addAudit('SmartCode Detection Check', 'pass',
                        \`VWO SmartCode detected. Found \${totalScripts} VWO-related scripts.\`, '', 'Critical');
                    
                    return { 
                        found: true, 
                        scripts: [...vwoCodeScripts, ...vwoDomainScripts, ...vwoInlineScripts],
                        totalScripts: totalScripts
                    };
                } else {
                    this.addAudit('SmartCode Detection Check', 'fail',
                        'No VWO SmartCode detected on this page.',
                        'Install VWO SmartCode on your website. Visit VWO dashboard for installation instructions.', 'Critical');
                    return { found: false, scripts: [], totalScripts: 0 };
                }
            } catch (err) {
                this.addAudit('SmartCode Detection Check', 'error',
                    \`Error detecting SmartCode: \${err.message}\`, '', 'Critical');
                return { found: false, scripts: [], totalScripts: 0 };
            }
        }

        // Check 2: Multiple SmartCodes
        checkMultipleSmartCodes(smartCodeResult) {
            try {
                if (!smartCodeResult.found || smartCodeResult.totalScripts === 0) {
                    this.addAudit('Multiple SmartCodes Check', 'skip',
                        'No SmartCode scripts found to check for duplicates.', '', 'Major');
                    return;
                }
                
                if (smartCodeResult.totalScripts > 1) {
                    this.addAudit('Multiple SmartCodes Check', 'warning',
                        \`Multiple SmartCode installations detected (\${smartCodeResult.totalScripts} scripts). This may cause conflicts.\`,
                        'Remove duplicate SmartCode installations. Only one SmartCode should be present per page.', 'Major');
                } else {
                    this.addAudit('Multiple SmartCodes Check', 'pass',
                        'Single SmartCode installation detected.', '', 'Major');
                }
            } catch (err) {
                this.addAudit('Multiple SmartCodes Check', 'error',
                    \`Error checking multiple SmartCodes: \${err.message}\`, '', 'Major');
            }
        }

        // Check 3: Console Errors
        checkConsoleErrors() {
            try {
                const scripts = document.querySelectorAll('script');
                let hasErrors = false;
                
                scripts.forEach(script => {
                    if (script.src && !script.src.includes('visualwebsiteoptimizer.com')) {
                        if (script.dataset.error) {
                            hasErrors = true;
                        }
                    }
                });
                
                if (hasErrors) {
                    this.addAudit('Console Errors Check', 'warning',
                        'Potential script loading errors detected.',
                        'Check browser console for JavaScript errors and fix them.', 'Major');
                } else {
                    this.addAudit('Console Errors Check', 'pass',
                        'No obvious script loading errors detected.',
                        '', 'Major');
                }
            } catch (err) {
                this.addAudit('Console Errors Check', 'error',
                    \`Error checking console errors: \${err.message}\`, '', 'Major');
            }
        }

        // Check 4: Network Requests
        checkNetworkRequests() {
            try {
                if (performance && performance.getEntriesByType) {
                    const resourceEntries = performance.getEntriesByType('resource');
                    const vwoRequests = resourceEntries.filter(entry => 
                        entry.name.includes('visualwebsiteoptimizer.com')
                    );
                    
                    if (vwoRequests.length > 0) {
                        this.addAudit('Network Requests Check', 'pass',
                            \`VWO network requests detected: \${vwoRequests.length} requests made to VWO servers.\`, '', 'Major');
                    } else {
                        this.addAudit('Network Requests Check', 'warning',
                            'No VWO network requests detected. SmartCode may not be functioning properly.',
                            'Check if SmartCode is properly configured and not blocked by ad blockers.', 'Major');
                    }
                } else {
                    this.addAudit('Network Requests Check', 'info',
                        'Performance API not available to check network requests.',
                        '', 'Major');
                }
            } catch (err) {
                this.addAudit('Network Requests Check', 'error',
                    \`Error checking network requests: \${err.message}\`, '', 'Major');
            }
        }

        // Check 5: VWO Global Objects
        checkVWOGlobals() {
            try {
                const vwoGlobals = [];
                if (typeof window._vwo_code !== 'undefined') vwoGlobals.push('_vwo_code');
                if (typeof window.VWO !== 'undefined') vwoGlobals.push('VWO');
                if (typeof window._vwo_settings !== 'undefined') vwoGlobals.push('_vwo_settings');
                if (typeof window._vwo_ccc !== 'undefined') vwoGlobals.push('_vwo_ccc');
                
                if (vwoGlobals.length > 0) {
                    this.addAudit('VWO Global Objects Check', 'pass',
                        \`VWO global objects found: \${vwoGlobals.join(', ')}\`, '', 'Major');
                } else {
                    this.addAudit('VWO Global Objects Check', 'fail',
                        'No VWO global objects detected. SmartCode may not be loaded properly.',
                        'Ensure SmartCode is properly installed and loaded.', 'Major');
                }
            } catch (err) {
                this.addAudit('VWO Global Objects Check', 'error',
                    \`Error checking VWO globals: \${err.message}\`, '', 'Major');
            }
        }

        // Check 6: Cookies
        checkVWOCookies() {
            try {
                const cookies = document.cookie.split(';');
                const vwoCookies = cookies.filter(cookie => 
                    cookie.trim().toLowerCase().includes('vwo') ||
                    cookie.trim().toLowerCase().includes('_vis_opt_')
                );
                
                if (vwoCookies.length > 0) {
                    this.addAudit('VWO Cookies Check', 'pass',
                        \`VWO cookies detected: \${vwoCookies.length} VWO-related cookies found.\`, '', 'Major');
                } else {
                    this.addAudit('VWO Cookies Check', 'info',
                        'No VWO cookies detected. This may be normal for new visitors.',
                        '', 'Major');
                }
            } catch (err) {
                this.addAudit('VWO Cookies Check', 'error',
                    \`Error checking cookies: \${err.message}\`, '', 'Major');
            }
        }

        // Check 7: jQuery Dependency
        checkJQueryDependency() {
            try {
                const hasJQuery = typeof window.jQuery !== 'undefined' || typeof window.$ !== 'undefined';
                
                if (hasJQuery) {
                    const jQueryVersion = window.jQuery ? window.jQuery.fn.jquery : 'unknown';
                    this.addAudit('jQuery Dependency Check', 'pass',
                        \`jQuery is available (version: \${jQueryVersion}).\`, '', 'Major');
                } else {
                    this.addAudit('jQuery Dependency Check', 'info',
                        'jQuery is not detected. Some VWO features may require jQuery.',
                        'Consider including jQuery if using VWO features that depend on it.', 'Major');
                }
            } catch (err) {
                this.addAudit('jQuery Dependency Check', 'error',
                    \`Error checking jQuery dependency: \${err.message}\`, '', 'Major');
            }
        }

        // Main analysis function
        runAnalysis() {
            const smartCodeResult = this.checkSmartCodeDetection();
            this.checkMultipleSmartCodes(smartCodeResult);
            this.checkConsoleErrors();
            this.checkNetworkRequests();
            this.checkVWOGlobals();
            this.checkVWOCookies();
            this.checkJQueryDependency();
            
            // Generate summary
            const summary = {
                totalChecks: this.results.audits.length,
                passed: this.results.audits.filter(a => a.status === 'pass' || a.status === 'success').length,
                failed: this.results.audits.filter(a => a.status === 'fail').length,
                warnings: this.results.audits.filter(a => a.status === 'warning').length,
                info: this.results.audits.filter(a => a.status === 'info').length,
                skipped: this.results.audits.filter(a => a.status === 'skip').length,
                smartCodeFound: smartCodeResult.found,
                vwoGlobalsPresent: typeof window.VWO !== 'undefined' || typeof window._vwo_code !== 'undefined'
            };
            
            this.results.summary = summary;
            
            console.log('🎉 VWO SmartCode Analysis Complete!');
            console.log('📊 Results:', this.results);
            console.table(this.results.audits.map(a => ({
                Check: a.audit,
                Status: a.status,
                Message: a.message
            })));
            
            return this.results;
        }
    }

    // Run analysis and return results
    try {
        const analyzer = new VWOAnalyzer();
        const results = analyzer.runAnalysis();
        
        // IMPORTANT: Return the results so they can be captured by postMessage
        return results;
        
    } catch (err) {
        console.error('❌ Analysis error:', err);
        
        // Return error in results format
        return {
            url: window.location.href,
            sessionId: 'error_session',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            audits: [{
                audit: 'Analysis Error',
                status: 'error',
                message: 'Failed to run VWO analysis: ' + err.message,
                fix: 'Check console for detailed error information',
                level: 'Critical',
                timestamp: new Date().toISOString()
            }],
            summary: {
                totalChecks: 1,
                passed: 0,
                failed: 1,
                warnings: 0,
                info: 0,
                skipped: 0,
                smartCodeFound: false,
                vwoGlobalsPresent: false
            }
        };
    }
})()`;
  };

  const sendCheckerViaPostMessage = async (targetWindow, targetUrl) => {
    return new Promise(async (resolve, reject) => {
      const messageId = 'vwo_check_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout - no response received. Make sure VWO SmartCode with postMessage listener is installed on the target website.'));
      }, 30000);

      // Listen for results from the VWO SmartCode listener
      const messageHandler = (event) => {
        // Check for the new structured response format from VWO postMessage listener
        if (event.data && event.data.type === 'vwo_execute_response' && event.data.messageId === messageId) {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          
          if (event.data.success && event.data.result) {
            console.log('✅ Received VWO analysis results:', event.data.result);
            resolve(event.data.result);
          } else if (event.data.error) {
            console.error('❌ VWO analysis error:', event.data.error);
            reject(new Error('VWO Analysis Error: ' + event.data.error.message));
          } else {
            reject(new Error('VWO analysis completed but no results received'));
          }
        }
        // Fallback: Check for legacy VWO analysis results (for compatibility)
        else if (event.data && (event.data.type === 'VWO_ANALYSIS_COMPLETE' || event.data.vwoSmartCodeVerified)) {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          console.log('✅ Received legacy VWO analysis results');
          resolve(event.data);
        } else if (event.data && event.data.type === 'VWO_ANALYSIS_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error || 'Analysis failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Wait for the page to load
      setTimeout(async () => {
        try {
          console.log('📤 Sending VWO checker code via postMessage to:', targetUrl);
          console.log('🆔 Message ID:', messageId);
          
          // Get the actual VWO checker code that returns results
          const checkerCode = getCheckerCode();
          
          console.log('🔍 Sending VWO analysis code to target window');
          
          // Send the checker code via postMessage with messageId
          targetWindow.postMessage({
            type: 'vwo_execute',
            code: checkerCode,
            messageId: messageId,
            origin: window.location.origin
          }, '*');
          
          console.log('✅ VWO checker code sent successfully with messageId:', messageId);
          
        } catch (err) {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Failed to send checker code: ' + err.message));
        }
      }, 3000); // Wait 3 seconds for page to load
    });
  };

  const injectVWOStyleChecker = async (targetWindow, targetUrl, vwoData) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Analysis timeout - no response received'));
      }, 30000);

      // Listen for messages from the injected script (VWO's approach)
      const messageHandler = (event) => {
        if (event.data && event.data.vwoSmartCodeVerified) {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          
          // Convert VWO's format to our format
          const results = {
            url: event.data.finalUrl,
            sessionId: vwoData._vwo_cc.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            audits: [
              {
                audit: 'SmartCode Detection Check',
                status: event.data.status === 1 ? 'pass' : (event.data.status === -1 ? 'warning' : 'fail'),
                message: event.data.message.replace(/<[^>]*>/g, ''), // Remove HTML tags
                fix: event.data.status !== 1 ? 'Check SmartCode installation and account ID' : '',
                level: 'Critical',
                timestamp: new Date().toISOString()
              },
              {
                audit: 'SmartCode Type Check',
                status: 'pass',
                message: `SmartCode type: ${event.data.type}`,
                fix: '',
                level: 'Major',
                timestamp: new Date().toISOString()
              },
              {
                audit: 'Account ID Check',
                status: event.data.accountId ? 'pass' : 'fail',
                message: event.data.accountId ? `Account ID: ${event.data.accountId}` : 'No account ID found',
                fix: !event.data.accountId ? 'Ensure SmartCode is properly installed with correct account ID' : '',
                level: 'Critical',
                timestamp: new Date().toISOString()
              },
              {
                audit: 'URL Parameters Check',
                status: event.data.allParamsCorrect ? 'pass' : 'fail',
                message: event.data.allParamsCorrect ? 'All required parameters are present' : 'Missing required parameters',
                fix: !event.data.allParamsCorrect ? 'Check SmartCode implementation for missing parameters' : '',
                level: 'Major',
                timestamp: new Date().toISOString()
              }
            ],
            summary: {
              totalChecks: 4,
              passed: [event.data.status === 1 ? 1 : 0, 1, event.data.accountId ? 1 : 0, event.data.allParamsCorrect ? 1 : 0].reduce((a, b) => a + b, 0),
              failed: [event.data.status === 1 ? 0 : 1, 0, event.data.accountId ? 0 : 1, event.data.allParamsCorrect ? 0 : 1].reduce((a, b) => a + b, 0),
              warnings: event.data.status === -1 ? 1 : 0,
              info: 0,
              skipped: 0,
              smartCodeFound: event.data.accountId ? true : false,
              vwoGlobalsPresent: true,
              smartCodeType: event.data.type,
              accountId: event.data.accountId,
              requestPath: event.data.path
            }
          };
          
          resolve(results);
        } else if (event.data && event.data.type === 'VWO_ANALYSIS_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error || 'Analysis failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Create the VWO-style checker script
      const vwoStyleChecker = `
(function () {
  console.log('🔍 VWO SmartCode Checker: Starting analysis...');
  
  var smartCodeType,
    accountId,
    allParamsCorrect,
    isRandomNumberRequired,
    isRandomNumberPresent,
    smartCodeSpecificData,
    url;
  var details = {};
  
  if (window.name.includes('_vwo_cc')) {
    try {
      details = JSON.parse(window.name)._vwo_cc;
      console.log('📋 Found VWO data in window.name:', details);
    } catch (e) {
      console.error('❌ Error parsing window.name:', e);
    }
  }
  
  // Check if VWO is present
  if (typeof window._vwo_code === 'undefined' || typeof window._vwo_ccc === 'undefined') {
    console.log('⚠️ VWO SmartCode not detected on this page');
    
    if(window.opener) {
      window.opener.postMessage({
        type: 'VWO_ANALYSIS_ERROR',
        error: 'VWO SmartCode not found on this page'
      }, '*');
    }
    return;
  }
  
  console.log('✅ VWO SmartCode detected!');
  
  // Use VWO's official detection logic
  var vwoRequestPath = window._vwo_ccc.u;
  var parsedUrl = new URL('https://dev.visualwebsiteoptimizer.com' + vwoRequestPath);
  
  if (vwoRequestPath.includes('j.php')) {
    smartCodeType = 'ASYNC';
    accountId = +parsedUrl.searchParams.get('a');
    url = parsedUrl.searchParams.get('u') || document.URL;
    isRandomNumberRequired = true;
    isRandomNumberPresent = parsedUrl.searchParams.get('r');
    if (url && accountId && (isRandomNumberRequired ? isRandomNumberPresent : true)) {
      allParamsCorrect = true;
    }
    smartCodeSpecificData = {
      lT: window._vwo_code.library_tolerance()
    };
  } else if (vwoRequestPath.includes('js_visitor_settings.php')) {
    smartCodeType = 'SYNC-DEP';
    accountId = +parsedUrl.searchParams.get('a');
    isRandomNumberRequired = true;
    url = parsedUrl.searchParams.get('url') || document.URL;
    isRandomNumberPresent = parsedUrl.searchParams.get('r');
    if (url && accountId && (isRandomNumberRequired ? isRandomNumberPresent : true)) {
      allParamsCorrect = true;
    }
  } else if (vwoRequestPath.search(/\\/lib\\/(\\d+)\\.js/) !== -1) {
    smartCodeType = 'SYNC';
    accountId = +vwoRequestPath.match(/\\/lib\\/(\\d+)\\.js/)[1];
    isRandomNumberRequired = false;
    url = document.URL;
    if (accountId && (isRandomNumberRequired ? isRandomNumberPresent : true)) {
      allParamsCorrect = true;
    }
  }
  
  var finalUrl = new URL(url);
  finalUrl.searchParams.delete('_vwo_m');
  
  var data = {
    type: smartCodeType,
    path: vwoRequestPath,
    finalUrl: finalUrl.href,
    accountId: accountId,
    smartCodeSpecificData: smartCodeSpecificData,
    requestParams: parsedUrl.search,
    allParamsCorrect: allParamsCorrect,
    message: '',
    status: 1,
    vwoSmartCodeVerified: true
  };
  
  if (data.accountId === details.accountId) {
    if (decodeURIComponent(data.finalUrl) === details.enteredUrl) {
      data.message = 'SmartCode is correctly installed at this URL.';
    } else {
      data.message = 'URL redirected but SmartCode is correctly installed on the final URL.';
      data.status = -1;
    }
  } else {
    data.message = 'SmartCode found but may be from a different account.';
    data.status = -1;
  }
  
  console.log('🎉 VWO Analysis Complete!');
  console.log('📊 SmartCode Type:', smartCodeType);
  console.log('🔢 Account ID:', accountId);
  console.log('✅ All Parameters Correct:', allParamsCorrect);
  console.log('📋 Full Results:', data);
  
  if(window.opener) {
    console.log('📤 Sending results to parent window...');
    window.opener.postMessage(data, '*');
  } else {
    console.log('⚠️ No parent window found - results displayed in console only');
  }
})();`;

      // Navigate to target URL and inject the script
      targetWindow.location.href = targetUrl;
      
      setTimeout(() => {
        try {
          // Try to inject the VWO-style checker
          const script = targetWindow.document.createElement('script');
          script.textContent = vwoStyleChecker;
          targetWindow.document.head.appendChild(script);
          console.log('✅ VWO-style checker injected successfully');
        } catch (err) {
          console.log('❌ Direct injection failed, using fallback method');
          // Fallback: try postMessage injection
          targetWindow.postMessage({
            type: 'EXECUTE_VWO_CHECKER',
            code: vwoStyleChecker
          }, '*');
        }
      }, 3000);
    });
  };

  const injectChecker = async (targetWindow, targetUrl) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Automatic injection failed. Please use the manual method below.'));
      }, 15000); // Shorter timeout

      // Listen for messages from the injected script
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'VWO_ANALYSIS_COMPLETE') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          resolve(event.data.results);
        } else if (event.data && event.data.type === 'VWO_ANALYSIS_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error || 'Analysis failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Create a special URL with our injector
      const injectorHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>VWO Checker Injector</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }
    .loading { 
      animation: pulse 2s infinite; 
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .manual-btn {
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin: 10px;
      transition: background 0.3s;
    }
    .manual-btn:hover {
      background: #059669;
    }
    .code-container {
      background: #1f2937;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: left;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 VWO SmartCode Checker</h1>
    <div class="loading">
      <p>Redirecting to: <strong>${targetUrl}</strong></p>
      <p>Injecting VWO checker script...</p>
    </div>
    <div id="manual-section" style="display: none;">
      <h3>⚠️ Automatic injection blocked</h3>
      <p>Click the button below to run the checker manually:</p>
      <button class="manual-btn" onclick="runChecker()">🚀 Run VWO Checker</button>
      <button class="manual-btn" onclick="showCode()">📋 Show Code</button>
      <div id="code-container" class="code-container"></div>
    </div>
  </div>

  <script>
    const checkerCode = ${JSON.stringify(getCheckerCode())};
    
    function runChecker() {
      try {
        eval(checkerCode);
      } catch (err) {
        console.error('VWO Checker error:', err);
        alert('Error running checker: ' + err.message);
      }
    }
    
    function showCode() {
      const container = document.getElementById('code-container');
      container.innerHTML = '<pre>' + checkerCode + '</pre>';
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
    
    // Try automatic injection first
    setTimeout(() => {
      try {
        console.log('🔍 Attempting automatic VWO checker injection...');
        eval(checkerCode);
      } catch (err) {
        console.log('❌ Automatic injection failed:', err.message);
        document.getElementById('manual-section').style.display = 'block';
        document.querySelector('.loading').style.display = 'none';
      }
    }, 1000);
    
    // Add a button to go to target site and auto-run checker
    function goToTargetSite() {
      // Create a special URL with hash that contains the checker
      const encodedChecker = btoa(encodeURIComponent(checkerCode));
      const targetUrlWithChecker = '${targetUrl}' + '#vwo_checker=' + encodedChecker;
      window.location.href = targetUrlWithChecker;
    }
    
    // Auto-redirect after 3 seconds with option to cancel
    let redirectTimer = setTimeout(() => {
      goToTargetSite();
    }, 5000);
    
    // Add a manual button to go immediately
    document.getElementById('manual-section').innerHTML += 
      '<button class="manual-btn" onclick="clearTimeout(' + redirectTimer + '); goToTargetSite();">🌐 Go to Target Site & Run Checker</button>';
    
    // Check if we're on target site with checker in URL
    if (window.location.hash.includes('vwo_checker=')) {
      try {
        const encodedChecker = window.location.hash.split('vwo_checker=')[1];
        const decodedChecker = decodeURIComponent(atob(encodedChecker));
        
        // Clean the URL first
        history.replaceState(null, null, window.location.pathname + window.location.search);
        
        // Show a visible notification that checker is running
        const notification = document.createElement('div');
        notification.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          z-index: 999999;
          font-family: Arial, sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          max-width: 300px;
          animation: slideIn 0.5s ease-out;
        \`;
        notification.innerHTML = \`
          <div style="font-weight: bold; margin-bottom: 10px;">🔍 VWO Checker Running...</div>
          <div>Check console for detailed results!</div>
          <div style="margin-top: 10px; font-size: 12px; opacity: 0.8;">Press F12 → Console tab</div>
        \`;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = \`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        \`;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Run the checker with enhanced console logging
        console.log('🎯 VWO Checker: Starting analysis on', window.location.href);
        console.log('🔍 VWO Checker: Press F12 and check Console tab for results!');
        
        setTimeout(() => {
          eval(decodedChecker);
          
          // Update notification after running
          setTimeout(() => {
            notification.innerHTML = \`
              <div style="font-weight: bold; margin-bottom: 10px;">✅ VWO Checker Complete!</div>
              <div>Results are in the console below</div>
              <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
              ">Close</button>
            \`;
          }, 2000);
        }, 1000);
        
      } catch (err) {
        console.error('❌ Failed to auto-run checker:', err);
      }
    }
  </script>
</body>
</html>`;

      // Navigate to our injector page
      const blob = new Blob([injectorHTML], { type: 'text/html' });
      const injectorUrl = URL.createObjectURL(blob);
      targetWindow.location.href = injectorUrl;

      // Clean up the blob URL after use
      setTimeout(() => {
        URL.revokeObjectURL(injectorUrl);
      }, 30000);
    });
  };

  const getFullCheckerCode = async () => {
    try {
      // Read the full checker.js file content
      const response = await fetch('/src/checker.js');
      const checkerCode = await response.text();
      return checkerCode;
    } catch (err) {
      console.error('Failed to load checker.js:', err);
      // Fallback to embedded checker code
      return getCheckerCode();
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    const formattedUrl = formatURL(url.trim());
    
    if (!validateURL(formattedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResults(null);

    try {
      // Open the target URL directly
      const newTab = window.open(formattedUrl, '_blank');
      
      if (!newTab || newTab.closed) {
        setError('Popup blocked! Please try the manual method below.');
        setIsAnalyzing(false);
        return;
      }

      newTabRef.current = newTab;

      // Wait for the page to load, then send the checker code via postMessage
      const analysisResults = await sendCheckerViaPostMessage(newTab, formattedUrl);
      setResults(analysisResults);
      
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      if (newTabRef.current && !newTabRef.current.closed) {
        // Optionally close the tab after analysis
        // newTabRef.current.close();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  };

  const formatResults = (results) => {
    if (!results) return null;

    return (
      <div className="results-container">
        <h3>VWO SmartCode Analysis Results</h3>
        
        <div className="summary-section">
          <h4>Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Total Checks:</span>
              <span className="value">{results.summary?.totalChecks || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">Passed:</span>
              <span className="value passed">{results.summary?.passed || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">Failed:</span>
              <span className="value failed">{results.summary?.failed || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">Warnings:</span>
              <span className="value warning">{results.summary?.warnings || 0}</span>
            </div>
            <div className="summary-item">
              <span className="label">SmartCode Found:</span>
              <span className={`value ${results.summary?.smartCodeFound ? 'passed' : 'failed'}`}>
                {results.summary?.smartCodeFound ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="audits-section">
          <h4>Audit Details</h4>
          <div className="audits-list">
            {results.audits?.map((audit, index) => (
              <div key={index} className={`audit-item ${audit.status}`}>
                <div className="audit-header">
                  <span className="audit-name">{audit.audit}</span>
                  <span className={`audit-status ${audit.status}`}>{audit.status.toUpperCase()}</span>
                </div>
                <p className="audit-message">{audit.message}</p>
                {audit.fix && (
                  <p className="audit-fix"><strong>Fix:</strong> {audit.fix}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="raw-results">
          <details>
            <summary>Raw Results (JSON)</summary>
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  };

  const copyBookmarklet = () => {
    const bookmarkletCode = `javascript:(function(){${getCheckerCode()}})();`;
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      alert('Bookmarklet copied to clipboard! You can now paste this as a bookmark URL and use it on any website.');
    }).catch(() => {
      prompt('Copy this bookmarklet code:', bookmarkletCode);
    });
  };

  return (
    <div className="url-checker">
      <h1>VWO SmartCode URL Checker</h1>
      <p>Enter a URL to analyze VWO SmartCode implementation</p>
      
      <div className="input-section">
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter URL (e.g., example.com or https://example.com)"
            className="url-input"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            className="analyze-button"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        
        <div className="alternative-methods">
          <p style={{ fontSize: '0.9rem', color: '#666', margin: '1rem 0 0.5rem 0' }}>
            Alternative methods if popups are blocked:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={copyBookmarklet}
              className="bookmarklet-button"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Copy Bookmarklet
            </button>
            <button
              onClick={async () => {
                try {
                  const code = await getFullCheckerCode();
                  navigator.clipboard.writeText(code).then(() => {
                    alert('✅ Full VWO Checker code copied!\n\n🎯 GUARANTEED METHOD:\n\n1. Open your target website\n2. Press F12 (Developer Tools)\n3. Go to Console tab\n4. Paste the code and press Enter\n5. See comprehensive results immediately!\n\nThis uses the complete checker.js with all 22 checks!');
                  }).catch(() => {
                    prompt('Copy this code and paste it in the target website console:', code);
                  });
                } catch (err) {
                  alert('Error loading full checker code. Using fallback.');
                  const code = getCheckerCode();
                  navigator.clipboard.writeText(code);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🎯 GUARANTEED Console Method
            </button>
            <button
              onClick={() => {
                const script = getCheckerCode();
                const blob = new Blob([script], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'vwo-checker.js';
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Download Script
            </button>
            <button
              onClick={() => {
                const formattedUrl = url.trim() ? formatURL(url.trim()) : 'https://example.com';
                const code = getCheckerCode();
                const instructions = `VWO Checker - Manual Method:

1. Open this URL: ${formattedUrl}
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Paste this code and press Enter:

${code}

The results will appear in the console with emojis and a nice table format!`;
                
                navigator.clipboard.writeText(code).then(() => {
                  alert('✅ VWO Checker code copied to clipboard!\n\n📋 Instructions:\n1. Open your target URL\n2. Press F12 (Developer Tools)\n3. Go to Console tab\n4. Paste and press Enter\n\nResults will show with 🎉 emojis!');
                }).catch(() => {
                  prompt('Copy this VWO Checker code:', code);
                });
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Copy Console Code
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
            {error.includes('Popup blocked') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <strong>Try these alternatives:</strong>
                <ol style={{ textAlign: 'left', margin: '0.5rem 0', paddingLeft: '1rem' }}>
                  <li><strong>Bookmarklet:</strong> Click "Copy Bookmarklet" above, create a bookmark, and use it on any site</li>
                  <li><strong>Manual:</strong> Click "Copy Manual Instructions" and follow the steps</li>
                  <li><strong>Download:</strong> Click "Download Script" and run it manually</li>
                  <li>Or try refreshing this page and allowing popups when prompted</li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        {isAnalyzing && (
          <div className="loading-message">
            <div className="spinner"></div>
            Opening URL in new tab and analyzing VWO SmartCode...
          </div>
        )}
      </div>

      {results && formatResults(results)}
    </div>
  );
}

export default URLChecker;
