'use strict';

let enhanchedNavigation;
if (!('Promise' in window)) {throw 'ES6 NOT SUPPORTED, ABORT!';}

{
    console.log('run script..');
    window.addEventListener('DOMContentLoaded', () => enhanchedNavigation.install());
    window.onpopstate = (event) => enhanchedNavigation.popstate(event);


    const inject = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // const script = doc.getElementById(this.scriptID);
        // if (script !== null) {
        //     script.remove();
        // }

        document.title = doc.title;
        if (document.head.innerHTML != doc.head.innerHTML) {
            document.head.parentNode.replaceChild(doc.head, document.head);
        }
        document.body.parentNode.replaceChild(doc.body, document.body);
    }

    const initProgressBar = () => {
        // let active = false;
        // let eject = false;

        let progress = document.createElement('div');
        progress.style.width = '0px';
        progress.classList.add('_swag');

        let timer;
        
        // let width = 0;
        // let maxwidth = window.innerWidth;

        // let timestamp = 0;
        // const animate = () => {
        //     if (eject) return;
            
        //     let now = window.performance.now();
        //     let dt = now - timestamp;
        //     timestamp = now;

        //     width += 0.5 * dt;
            


        //     progress.style.width = width + 'px';

        //     //console.log(dt);
        //     if (width >= maxwidth) {
        //         console.log('DONE');
        //         return;
        //     }

        //     requestAnimationFrame(animate);
        // };

        
        return {
            start: () => {
                progress.style.width = '100px';
                // width = 0;
                // maxwidth = window.innerWidth;
                // timestamp = window.performance.now();
                // animate();
                // clearTimeout(timer);
                // console.log('start it');
                // progress.style.width = '0px';
                // let x = progress.offsetHeight;
                // progress.style.width = '100%';
            },
            complete: () => {
                
                // console.log('END IT');
                // timer = setTimeout(() => progress.style.width = '0px', 2200);
            },
            install: () => {
                console.log('install div');
                document.documentElement.insertBefore(progress, document.body);
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
            let html = await this.get(url);
            inject(html);
            this.progress.complete();
            window.history.replaceState({scroll: document.documentElement.scrollTop}, '', document.location.href);
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
















// 'use strict';

// let enhanchedNavigation;
// if (!('Promise' in window)) {throw 'ES2015 NOT SUPPORTED, ABORT!';}

// {
//     window.addEventListener('DOMContentLoaded', () => {enhanchedNavigation = new NavigationController();});

//     const _progressBar = (height, color) => {
//         const style = document.getElementsByTagName('style');
//         if (style.length == 0) {throw `Can't bind to stylesheet, abort!`;}
//         style[0].sheet.insertRule('@keyframes __fade {0% {opacity:1;} 100% {opacity:0;}', style[0].sheet.cssRules.length);
//         style[0].sheet.insertRule('.__fade-out {animation:__fade; animation-duration:0.5s;}', style[0].sheet.cssRules.length);
    
//         const div = document.createElement('div');
//         div.style.width = '0px';
//         div.style.height = `${height}px`;
//         div.style.position = 'fixed';
//         div.style.backgroundColor = color;
//         div.onanimationend = () => {console.log('END ANiM'); div.style.width = 0;};
//         document.documentElement.insertBefore(div, document.body);

//         let current = 0;
//         let end = 0;
//         let timestamp = 0;
//         let step = 1;
//         let stall = true;

//         const progress = () => {
//             if (current >= end) {
//                 div.classList.add('__fade-out');
//                 return;
//             };
            
//             let now = performance.now();
            
//             if (stall && current > (0.6 * end)) {
//                 step = end / 8000;
//                 stall = false;
//             }

//             current += step * (now - timestamp);
//             timestamp = now;  
//             div.style.width = `${current}px`;
            
//             requestAnimationFrame(progress);
//         };

//         return {
//             start: () => {
//                 div.classList.remove('__fade-out');
//                 stall = true;
//                 current = 0;
//                 end = window.innerWidth;
//                 step = end / 2000;
//                 timestamp = performance.now();
//                 progress();
//             },
//             stop: () => {current = Infinity;},
//             complete: () => {
//                 stall = false;
//                 step = end / 500;
//             }
//         };
//     };

//     class NavigationController {
//         constructor() {
//             this.hostname = window.location.hostname;
//             this.cache = new Map();
//             this.lastRequest = null;
//             this.scriptID = 'swag';
//             this.cacheTTL = 20 * 60 * 1000; // ms
//             this.progress = _progressBar(3, '#00a3d9');

//             // binds
//             this.popstate = this.popstate.bind(this);
//             this.handler = this.handler.bind(this);

//             // init
//             window.onpopstate = this.popstate;
//             this.hydrate();
//         }

//         popstate(evt) {
//             //console.log(document.location, evt);
            
//             this.lastRequest = document.location;  
//             if (evt.state != null && evt.state.scroll != null) {
//                 this.fetch(document.location, false, evt.state.scroll);
//             } else {
//                 this.fetch(document.location, false, 0);
//             }
//         }

//         hydrate() {
//             const nodes = document.querySelectorAll('a[href]');
//             for (const node of nodes) {
//                 if (node.hostname == this.hostname) {
//                     node.onclick = this.handler;
//                     if (node.dataset.prefetch != undefined) {
//                         this.prefetch(node.href);
//                     }
//                 }
//             }
//         }

//         fetch(url, setHistory, scroll) {
//             this.progress.start();
            
//             let cachedPage = this.cache.get(url);
//             if (cachedPage !== undefined) {
//                 if (cachedPage.ttl > Date.now()) {
//                     if (setHistory) {
//                         history.pushState({scroll: 0}, '', url);
//                     }
//                     this.update(cachedPage.body, scroll);                
//                     return;
//                 }
//             }
        
//             window.fetch(url, {method: 'GET'})
//                 .then(resp => resp.text())
//                 .then(body => {
//                     if (this.lastRequest == url) {
//                         if (setHistory) {
//                             history.pushState({scroll: 0}, '', url);
//                         }
//                         this.update(body, scroll);
//                     }
//                     this.cache.set(url, {body: body, ttl: Date.now() + this.cacheTTL});
//                 })
//                 .catch((_) => {
//                     // bail if something breaks
//                     window.location.href = url;
//                 });
//         }

//         prefetch(url) {
//             if (this.cache.has(url)) return;
//             window.fetch(url, {method: 'GET'})
//                 .then(resp => resp.text())
//                 .then(body => this.cache.set(url, {body: body, ttl: Date.now() + this.cacheTTL}))
//                 .catch((err) => {
//                     console.error('prefetch failed:', err);
//                 });
//         }

//         update(body, scroll) {
//             this.progress.complete();
//             this.inject(body);
//             this.hydrate();

//             if (scroll != null) {
//                 window.scrollTo(0, scroll);
//             } else {
//                 window.scrollTo(0, 0);
//             }
//         }

//         handler(evt) {
//             evt.preventDefault();
//             window.history.replaceState({scroll: document.documentElement.scrollTop}, '', document.location);
//             if (this.lastRequest == evt.currentTarget.href) return;
//             this.lastRequest = evt.currentTarget.href;
//             this.fetch(evt.currentTarget.href, true, 0);
//         }

//         inject(body) {
//             const doc = new DOMParser().parseFromString(body, 'text/html');

//             const script = doc.getElementById(this.scriptID);
//             if (script !== null) {
//                 script.remove();
//             }

//             document.title = doc.title;
//             if (document.head.innerHTML != doc.head.innerHTML) {
//                 document.head.parentNode.replaceChild(doc.head, document.head);
//             }
//             document.body.parentNode.replaceChild(doc.body, document.body);
//         }
//     }
// }