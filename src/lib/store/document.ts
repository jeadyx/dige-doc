import { create } from 'zustand';
import { Document, DocumentTree } from '@/types/document';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  documentTree: DocumentTree[];
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  setDocumentTree: (tree: DocumentTree[]) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  documentTree: [],
  
  setDocuments: (documents) => set({ documents }),
  
  setCurrentDocument: (document) => set({ currentDocument: document }),
  
  setDocumentTree: (tree) => set({ documentTree: tree }),
  
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
      currentDocument:
        state.currentDocument?.id === id
          ? { ...state.currentDocument, ...updates }
          : state.currentDocument,
    })),
})); 