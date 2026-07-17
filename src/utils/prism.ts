import Prism from 'prismjs';

// Disable Prism's automatic highlight-on-load; we highlight explicitly in CodeView.
Prism.manual = true;

// Languages: markup (html/xml), css, javascript, json.
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

// Line-numbers plugin + its (theme-independent) styles.
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

export default Prism;
