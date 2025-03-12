export function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // 1. 处理表格
  html = html.replace(/\|(.+?)\|[\r\n]/g, (match, content) => {
    const cells = content.split('|').map((cell: string) => cell.trim());
    return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>\n`;
  });
  html = html.replace(/(\|(?:.+?\|)+[\r\n]){2,}/g, (match) => {
    const rows = match.split('\n').filter(row => row.trim());
    if (rows.length >= 2) {
      // 移除分隔行（包含 -）
      const dataRows = rows.filter(row => !row.includes('---'));
      return `<table><tbody>${dataRows.join('')}</tbody></table>\n`;
    }
    return match;
  });

  // 2. 处理行内格式（注意顺序：先处理组合格式，再处理单一格式）
  html = html
    // 处理粗体+斜体组合
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    // 处理粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // 处理斜体
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    .replace(/_([^_]+?)_/g, '<em>$1</em>')
    // 处理删除线
    .replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 3. 处理列表
  // 处理连续的无序列表项
  html = html.replace(/(?:^|\n)((?:[-*+]\s+.+\n?)+)/gm, (_, list) => {
    const items = list
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^[-*+]\s+(.+)$/, '<li>$1</li>'))
      .join('');
    return `\n<ul>${items}</ul>\n`;
  });

  // 处理连续的有序列表项
  html = html.replace(/(?:^|\n)((?:\d+\.\s+.+\n?)+)/gm, (_, list) => {
    const items = list
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => line.replace(/^\d+\.\s+(.+)$/, '<li>$1</li>'))
      .join('');
    return `\n<ol>${items}</ol>\n`;
  });

  // 4. 处理其他 Markdown 语法
  html = html
    // 处理标题
    .replace(/^(#{1,6})\s+(.+)$/gm, (_, level, content) => {
      const headingLevel = level.length;
      return `<h${headingLevel}>${content}</h${headingLevel}>`;
    })
    // 处理代码块
    .replace(/```(\w+)?\n([\s\S]+?)\n```/g, (_, language, code) => {
      return `<pre><code class="language-${language || 'plaintext'}">${code}</code></pre>`;
    })
    // 处理行内代码
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // 处理引用
    .replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // 处理水平线
    .replace(/^[-*_]{3,}$/gm, '<hr>')
    // 处理链接
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // 处理图片
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');

  // 5. 处理段落（将剩余的文本行包装在 <p> 标签中）
  html = html.split('\n').map(line => {
    if (line.trim() && !line.match(/<[^>]+>/)) {
      return `<p>${line}</p>`;
    }
    return line;
  }).join('\n');

  return html;
} 