'use strict';

let _appz = null;
window.addEventListener('DOMContentLoaded', () => {_appz = new NavigationController();});

const _progressBar = (height, color) => {
    const style = document.getElementsByTagName('style');
    if (style.length == 0) {throw `Can't bind to stylesheet, abort!`;}
    style[0].sheet.insertRule('@keyframes __fade {0% {opacity:1;} 100% {opacity:0;}', style[0].sheet.cssRules.length);
    style[0].sheet.insertRule('.__fade-out {animation:__fade; animation-duration:0.5s;}', style[0].sheet.cssRules.length);
 
    const div = document.createElement('div');
    div.style.width = '0px';
    div.style.height = `${height}px`;
    div.style.position = 'fixed';
    div.style.backgroundColor = color;
    div.onanimationend = () => {console.log('END ANiM'); div.style.width = 0;};
    document.documentElement.insertBefore(div, document.body);

    let current = 0;
    let end = 0;
    let timestamp = 0;
    let step = 1;
    let stall = true;

    const progress = () => {
        if (current >= end) {
            div.classList.add('__fade-out');
            return;
        };
        
        let now = performance.now();
        
        if (stall && current > (0.6 * end)) {
            step = end / 8000;
            stall = false;
        }

        current += step * (now - timestamp);
        timestamp = now;  
        div.style.width = `${current}px`;
        
        requestAnimationFrame(progress);
    };

    return {
        start: () => {
            div.classList.remove('__fade-out');
            stall = true;
            current = 0;
            end = window.innerWidth;
            step = end / 2000;
            timestamp = performance.now();
            progress();
        },
        stop: () => {current = Infinity;},
        complete: () => {
            stall = false;
            step = end / 500;
        }
    };
};

class NavigationController {
    constructor() {
        this.hostname = window.location.hostname;
        this.cache = new Map();
        this.lastRequest = null;
        this.scriptID = 'swag';
        this.cacheTTL = 20 * 60 * 1000; // ms
        this.progress = _progressBar(3, '#00a3d9');

        // binds
        this.popstate = this.popstate.bind(this);
        this.handler = this.handler.bind(this);

        // init
        window.onpopstate = this.popstate;
        this.hydrate();
    }

    popstate(evt) {
        this.lastRequest = document.location;  
        if (evt.state != null && evt.state.scroll != null) {
            this.fetch(document.location, false, evt.state.scroll);
        } else {
            this.fetch(document.location, false, 0);
        }
    }

    hydrate() {
        const nodes = document.querySelectorAll('a[href]');
        for (const node of nodes) {
            if (node.hostname == this.hostname) {
                node.onclick = this.handler;
                if (node.dataset.prefetch != undefined) {
                    this.prefetch(node.href);
                }
            }
        }
    }

    fetch(url, setHistory, scroll) {
        this.progress.start();
        
        let cachedPage = this.cache.get(url);
        if (cachedPage !== undefined) {
            if (cachedPage.ttl > Date.now()) {
                if (setHistory) {
                    history.pushState({scroll: 0}, '', url);
                }
                this.update(cachedPage.body, scroll);                
                return;
            }
        }
    
        window.fetch(url, {method: 'GET'})
            .then(resp => resp.text())
            .then(body => {
                if (this.lastRequest == url) {
                    if (setHistory) {
                        history.pushState({scroll: 0}, '', url);
                    }
                    this.update(body, scroll);
                }
                this.cache.set(url, {body: body, ttl: Date.now() + this.cacheTTL});
            })
            .catch((_) => {
                // bail if something breaks
                window.location.href = url;
            });
    }

    prefetch(url) {
        if (this.cache.has(url)) return;
        window.fetch(url, {method: 'GET'})
            .then(resp => resp.text())
            .then(body => this.cache.set(url, {body: body, ttl: Date.now() + this.cacheTTL}))
            .catch((err) => {
                console.error('prefetch failed:', err);
            });
    }

    update(body, scroll) {
        this.progress.complete();
        this.inject(body);
        this.hydrate();

        if (scroll != null) {
            window.scrollTo(0, scroll);
        } else {
            window.scrollTo(0, 0);
        }
    }

    handler(evt) {
        evt.preventDefault();
        window.history.replaceState({scroll: document.documentElement.scrollTop}, '', document.location);
        if (this.lastRequest == evt.currentTarget.href) return;
        this.lastRequest = evt.currentTarget.href;
        this.fetch(evt.currentTarget.href, true, 0);
    }

    inject(body) {
        const doc = new DOMParser().parseFromString(body, 'text/html');

        const script = doc.getElementById(this.scriptID);
        if (script !== null) {
            script.remove();
        }

        document.title = doc.title;
        if (document.head.innerHTML != doc.head.innerHTML) {
            document.head.parentNode.replaceChild(doc.head, document.head);
        }
        document.body.parentNode.replaceChild(doc.body, document.body);
    }
}