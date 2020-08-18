'use strict';

let enhanchedNavigation;
if (!('Promise' in window)) {throw 'ES6 NOT SUPPORTED, ABORT!';}

{
    window.addEventListener('DOMContentLoaded', () => enhanchedNavigation.install());
    window.onpopstate = (event) => enhanchedNavigation.popstate(event);


    const inject = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        document.title = doc.title;
        if (document.head.innerHTML != doc.head.innerHTML) {
            document.head.parentNode.replaceChild(doc.head, document.head);
        }
        document.body.parentNode.replaceChild(doc.body, document.body);
    }

    const initProgressBar = () => {
        let progress = document.createElement('div');
        progress.style.width = '0px';
        progress.style.position = 'fixed';
        progress.style.height = '3px';
        progress.style.backgroundColor = '#00a3d9';

        let width = 0;
        let current = -1;
        let start;
        let maxwidth = 0;
        let speed = 0;
        let ok = false;

        const animate = (id) => {
            if (id != current) return;

            let now = window.performance.now();
            let dt = now - start;
            start = now; 

            if (width > maxwidth) {
                if (ok) {
                    progress.style.opacity = '0';
                    return;
                }
            } else {
                width += dt * speed;
                progress.style.width = `${width}px`;
            }

            requestAnimationFrame(() => animate(id)); // this is bad?
        };

        return {
            start: () => {
                progress.style.trasition = 'opacity 0ms linear';
                progress.style.width = '0px';
                progress.style.opacity = '1';
                progress.style.transition = 'opacity 200ms linear';

                ok = false;
                current++;
                start = window.performance.now();
                width = -100;
                maxwidth = 0.9 * window.innerWidth;
                speed = maxwidth / 2000;
                animate(current);
            },
            complete: () => {
                ok = true;
                maxwidth = window.innerWidth;
                speed = maxwidth / 500;
            },
            install: () => {
                document.documentElement.insertBefore(progress, document.body);
            },
            setColor: (color) => {
                progress.style.backgroundColor = color;
            },
            setHeight: (h) => {
                progress.style.height = `${h}px`;
            }
        };
    }

    enhanchedNavigation = {
        hostname: window.location.hostname,
        progress: initProgressBar(),
        cache: new Map(),
        lastRequest: null,
        cacheTTL: 20 * 60 * 1000 // ms
    };

    enhanchedNavigation.install = function() {
        this.progress.install();
        this.hydrate();
    };

    enhanchedNavigation.handler = async function(event) {
        const url = event.currentTarget.href;
        event.preventDefault();
        this.progress.start();
        
        try {
            window.history.replaceState({scroll: document.documentElement.scrollTop}, '', document.location.href);
            let html = await this.get(url);
            inject(html);
            this.progress.complete();
            window.history.pushState({scroll: 0}, '', url);
            window.scrollTo(0, 0);
            this.hydrate();
        } catch (err) {
            window.location.href = url; // bail if something breaks
        }  
    };

    enhanchedNavigation.hydrate = function() {
        const nodes = document.querySelectorAll('a[href]');
        for (const node of nodes) {
            if (node.hostname == this.hostname) {
                node.onclick = (event) => this.handler(event);
                if (node.dataset.prefetch != undefined) {
                    this.get(node.href);
                }
            }
        }
    };

    enhanchedNavigation.get = function(url) {
        return new Promise((resolve, reject) => {
            let cachedPage = this.cache.get(url);
            if (cachedPage !== undefined && cachedPage.ttl > Date.now()) { 
                resolve(cachedPage.body);
            } else {
                fetch(url)
                    .then(resp => resp.text())
                    .then(html => {
                        resolve(html);
                        this.cache.set(url, {body: html, ttl: Date.now() + this.cacheTTL});
                    })
                    .catch(err => reject(err));
            }
        });
    };

    enhanchedNavigation.popstate = async function(event) {
        this.progress.start()
        inject(await this.get(document.location.href));
        this.progress.complete();
        window.scrollTo(0, event.state.scroll !== undefined ? event.state.scroll : 0);  
        this.hydrate();
    };
}