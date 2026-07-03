const SITE_URL = 'https://nailongti.pages.dev';

type ShareSiteStatus = 'shared' | 'copied' | 'wechat-guide' | 'failed';
type CopyStatus = 'copied' | 'failed';
type ShareImageStatus = 'shared' | 'unsupported' | 'failed';

export function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

export async function shareSite(typeName?: string): Promise<ShareSiteStatus> {
  const title = '奶龙TI人格测试';
  const text = typeName ? `我测出来是「${typeName}」，你也来测测` : '测测你是哪种离谱奶龙';

  if (isWeChatBrowser()) {
    await copySiteLink();
    return 'wechat-guide';
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: SITE_URL });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'failed';
    }
  }

  return copySiteLink();
}

export async function copySiteLink(): Promise<CopyStatus> {
  try {
    await navigator.clipboard.writeText(SITE_URL);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export async function shareImage(blob: Blob, typeName: string): Promise<ShareImageStatus> {
  if (isWeChatBrowser()) return 'unsupported';

  const file = new File([blob], `NailongTI-${typeName}.png`, { type: 'image/png' });
  const canShareFile = Boolean(navigator.canShare?.({ files: [file] }));
  if (!navigator.share || !canShareFile) return 'unsupported';

  try {
    await navigator.share({
      title: '奶龙TI人格测试',
      text: `我测出来是「${typeName}」，扫码也能测`,
      files: [file],
    });
    return 'shared';
  } catch {
    return 'failed';
  }
}

export { SITE_URL };
