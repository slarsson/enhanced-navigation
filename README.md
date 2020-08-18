# enhanced-navigation
This script enhances navigating between pages on a static website. It supports caching and pre-fetching of HTML-content. 

This is essentially a small and simple implementation of Turbolinks ([github.com/turbolinks/turbolinks](https://github.com/turbolinks/turbolinks)).


### Usage
Add the script to all pages of a static website. 
```html
<!doctype html>
<html>

<head>
    <title>example</title>
</head>

<body>
    <header></header>
    <main></main>
    <footer></footer>

    <script src="nav.min.js"></script>
</body>
</html>
```

### Prefetch
Add data-prefetch attribute to selected ``<a>``-tags.
```html
<href="#" data-prefetch="true">my href</a>
```

### Example
Run dev-script to view example at: localhost:1337/example 
```
npm run dev
```

### Build
Run build-script to minify nav.js (nav.js => nav.min.js)
```
npm run build
```
