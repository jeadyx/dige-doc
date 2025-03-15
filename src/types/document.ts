export type Theme = 'light' | 'sepia' | 'dark';

export interface EditorStyle {
  fontSize: string;
  lineHeight: string;
  paragraphSpacing: string;
  theme: Theme;
  fontFamily: string;
  customCSS: string;
}

export interface TextStyle {
  color: string;
  backgroundColor: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  customCSS: string;
}

export interface DocumentStyle {
  editor: EditorStyle;
  text: TextStyle;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  style: string; // JSON string of DocumentStyle
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
  order: number;
  forkCount?: number; // 被 fork 的次数
  authorName?: string; // 作者名称
}

export interface DocumentTree extends Document {
  children?: DocumentTree[];
}

export interface CreateDocumentInput {
  title: string;
  content?: string;
  parentId?: string;
  style?: string;
  userId?: string;
  isPublic?: boolean;
}

export interface UpdateDocumentInput {
  id: string;
  title?: string;
  isPublic?: boolean;
  content?: string;
  parentId?: string;
  order?: number;
}

export type ExportFormat = 'md' | 'docx' | 'html';

export interface DocumentMeta {
  id: string;
  title: string;
  updatedAt: Date;
  isPublic: boolean;
} 