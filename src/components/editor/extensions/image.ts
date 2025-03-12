import Image from '@tiptap/extension-image';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
            style: `height: ${attributes.height}`,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => {
          if (!attributes.align || attributes.align === 'left') {
            return {};
          }
          return {
            'data-align': attributes.align,
            style: `display: block; margin: ${attributes.align === 'center' ? '0 auto' : `0 ${attributes.align === 'right' ? '0 0 auto' : 'auto 0 0'}`}`,
          };
        },
      },
    };
  },
}); 