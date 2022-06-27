# Cardboard

Google Cardboard JavaScript viewer

## Development

iOS 13 limits use of the accelerator to secure websites, meaning that it is necessary to run the local development server over HTTPS. This can be done as follows:

```bash
pipenv install
pipenv run python3 service.py
```

## Usage

```html
<div
     data-src="603822945.523954.jpeg"
     data-projection="equirectangular">
</div>
...
<script type="module">
    import { Cardboard } from './cardboard.js';
    Cardboard.initialize( document.body );
</script>
```
