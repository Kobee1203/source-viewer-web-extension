import Prism from 'prismjs';

// Disable Prism's automatic highlight-on-load; we highlight explicitly in CodeView.
Prism.manual = true;

// Languages needed for parity: markup (html), css, javascript.
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

// Line-numbers plugin + its (theme-independent) styles.
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

export default Prism;
