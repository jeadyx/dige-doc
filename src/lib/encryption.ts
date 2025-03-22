/**
 * 简单的加密解密工具
 * 
 * 使用XOR加密和Base64编码实现简单的字符串加密
 * 注意：此方法不是密码学安全的，仅用于基本的本地存储保护
 * 对于真正需要高安全性的场景，请使用Web Crypto API
 */

// 生成一个简单的密钥，基于当前域名和一些随机字符
const getEncryptionKey = (): string => {
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const salt = 'dige-doc-salt-8a7b6c5d';
  return domain + salt;
};

/**
 * 使用XOR和Base64对文本进行加密
 */
export const encryptText = (text: string): string => {
  try {
    if (!text) return '';
    
    const key = getEncryptionKey();
    let result = '';
    
    // 使用XOR加密
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    // 转换为Base64编码
    return btoa(result);
  } catch (error) {
    console.error('加密失败:', error);
    return '';
  }
};

/**
 * 解密之前加密的文本
 */
export const decryptText = (encryptedText: string): string => {
  try {
    if (!encryptedText) return '';
    
    const key = getEncryptionKey();
    
    // 从Base64解码
    const decoded = atob(encryptedText);
    let result = '';
    
    // 使用XOR解密
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error('解密失败:', error);
    return '';
  }
}; 