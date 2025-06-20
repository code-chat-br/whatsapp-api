(function () {
    const params = new URLSearchParams(document.currentScript.src.split('?')[1] || '');

    const env = params.get('env') || 'local';
    const isDocker = params.get('docker') === 'true';
    const version = params.get('version') || '0.0.0';

    !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0';
        n.queue = [];
        t = b.createElement(e); t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '1269134504699994');
    fbq('track', 'PageView', JSON.stringify({
        environment: env,
        docker: isDocker,
        version: version,
    }));
})();
