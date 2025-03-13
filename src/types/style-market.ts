export type StyleCategory =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'blockquote'
  | 'codeBlock'
  | 'paragraph'
  | 'link'
  | 'list';

export interface StyleItem {
  name: string;
  css: string;
  preview: string;
}

export interface StyleCategoryData {
  title: string;
  description: string;
  styles: StyleItem[];
} 